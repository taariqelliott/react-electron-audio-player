import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import {
  AppConfig,
  CreateFolderArgs,
  Manifest,
  SearchResult,
  TrackEntry,
  UpdateFolderArgs,
  UpdateProfileArgs,
  UpdateTrackArgs
} from '@shared/types'
import Database from 'better-sqlite3'
import { app, BrowserWindow, dialog, ipcMain, net, protocol, shell } from 'electron'
import { parseFile } from 'music-metadata'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path, { join } from 'node:path'
import icon from '../../resources/icon.png?asset'

let db: Database.Database

// ─── Window ───────────────────────────────────────────────────────────────────

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    roundedCorners: false,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true
    },
    minWidth: 900,
    minHeight: 700
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const configPath = (): string => path.join(app.getPath('userData'), 'config.json')

const readConfig = (): AppConfig => JSON.parse(fs.readFileSync(configPath(), 'utf-8'))

// Merges updates so profile fields survive library-root changes and vice versa
const writeConfig = (updates: Partial<AppConfig>): void => {
  const current = fs.existsSync(configPath())
    ? JSON.parse(fs.readFileSync(configPath(), 'utf-8'))
    : {}
  fs.writeFileSync(configPath(), JSON.stringify({ ...current, ...updates }, null, 2))
}

const manifestPathFor = (folderPath: string): string => path.join(folderPath, '.manifest.json')

const readManifest = (folderPath: string): Manifest =>
  JSON.parse(fs.readFileSync(manifestPathFor(folderPath), 'utf-8'))

const writeManifest = (folderPath: string, manifest: Manifest): void => {
  manifest.updatedAt = new Date().toISOString()
  fs.writeFileSync(manifestPathFor(folderPath), JSON.stringify(manifest, null, 2))
}

// Flags tracks whose files are gone from disk and returns tracks sorted by order
const withMissingFlags = (manifest: Manifest): Manifest => ({
  ...manifest,
  tracks: [...(manifest.tracks ?? [])]
    .sort((a, b) => a.trackOrder - b.trackOrder)
    .map((track) => ({
      ...track,
      missing: !fs.existsSync(path.join(manifest.folderPath, track.filename))
    }))
})

// Avoids clobbering an existing file by appending a numeric suffix
const uniqueDestination = (dir: string, filename: string): string => {
  const ext = path.extname(filename)
  const base = path.basename(filename, ext)
  let candidate = filename
  let counter = 1
  while (fs.existsSync(path.join(dir, candidate))) {
    candidate = `${base}-${counter}${ext}`
    counter++
  }
  return path.join(dir, candidate)
}

const folderIdFor = (folderPath: string): number | null => {
  const row = db.prepare('SELECT id FROM folders WHERE folderPath = ?').get(folderPath) as
    | { id: number }
    | undefined
  return row?.id ?? null
}

const scanManifests = (libraryRoot: string): Manifest[] => {
  if (!libraryRoot || !fs.existsSync(libraryRoot)) return []
  return fs
    .readdirSync(libraryRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const folderPath = path.join(libraryRoot, entry.name)
      if (!fs.existsSync(manifestPathFor(folderPath))) return null
      try {
        const manifest = readManifest(folderPath)
        // Keep manifest paths in sync if the library was moved on disk
        manifest.folderPath = folderPath
        return manifest
      } catch {
        return null
      }
    })
    .filter((manifest): manifest is Manifest => manifest !== null)
}

const insertFolderRow = (manifest: Manifest): number => {
  const result = db
    .prepare(
      `INSERT INTO folders (name, type, artist, artwork, folderPath, totalTracks, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      manifest.name,
      manifest.type,
      manifest.artist,
      manifest.artwork ?? '',
      manifest.folderPath,
      manifest.totalTracks ?? 0,
      manifest.createdAt,
      manifest.updatedAt
    )
  return Number(result.lastInsertRowid)
}

const insertTrackRow = (folderId: number, folderPath: string, track: TrackEntry): void => {
  db.prepare(
    `INSERT INTO tracks (folderId, title, artist, filename, duration, trackOrder, folderPath, addedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    folderId,
    track.title,
    track.artist,
    track.filename,
    track.duration,
    track.trackOrder,
    folderPath,
    track.addedAt
  )
}

const rebuildIndex = (): { folders: number; tracks: number } => {
  const { libraryRoot } = readConfig()
  const manifests = libraryRoot ? scanManifests(libraryRoot) : []

  const rebuild = db.transaction(() => {
    db.prepare('DELETE FROM tracks').run()
    db.prepare('DELETE FROM folders').run()
    let trackCount = 0
    for (const manifest of manifests) {
      const folderId = insertFolderRow(manifest)
      for (const track of manifest.tracks ?? []) {
        insertTrackRow(folderId, manifest.folderPath, track)
        trackCount++
      }
    }
    return { folders: manifests.length, tracks: trackCount }
  })

  return rebuild()
}

// ─── App Ready ────────────────────────────────────────────────────────────────

protocol.registerSchemesAsPrivileged([
  { scheme: 'localfile', privileges: { secure: true, supportFetchAPI: true } }
])

app.whenReady().then(() => {
  protocol.handle('localfile', (request) => {
    // Query string is only a cache-buster; strip it before hitting the filesystem
    const filePath = decodeURIComponent(request.url.slice('localfile://'.length).split('?')[0])
    return net.fetch(`file://${filePath}`)
  })
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ─── Config ─────────────────────────────────────────────────────────────

  if (!fs.existsSync(configPath())) {
    writeConfig({ libraryRoot: null })
  }

  // ─── Database ───────────────────────────────────────────────────────────

  const libraryDatabasePath = path.join(app.getPath('userData'), 'library.db')
  db = new Database(libraryDatabasePath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id          INTEGER   PRIMARY KEY AUTOINCREMENT,
      name        TEXT      NOT NULL,
      type        TEXT      NOT NULL,
      artist      TEXT      NOT NULL,
      artwork     TEXT,
      folderPath  TEXT      NOT NULL,
      totalTracks INTEGER   NOT NULL,
      createdAt   TEXT      NOT NULL,
      updatedAt   TEXT      NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id          INTEGER   PRIMARY KEY AUTOINCREMENT,
      folderId    INTEGER   NOT NULL,
      title       TEXT      NOT NULL,
      artist      TEXT      NOT NULL,
      filename    TEXT      NOT NULL,
      duration    INTEGER   NOT NULL,
      trackOrder  INTEGER   NOT NULL,
      folderPath  TEXT      NOT NULL,
      addedAt     TEXT      NOT NULL,
      FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE CASCADE
    )
  `)

  // Populate the index on first launch with an empty database
  const folderCount = db.prepare('SELECT COUNT(*) AS count FROM folders').get() as {
    count: number
  }
  const { libraryRoot } = readConfig()
  if (folderCount.count === 0 && libraryRoot && fs.existsSync(libraryRoot)) {
    rebuildIndex()
  }

  // ─── Launch ─────────────────────────────────────────────────────────────

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// ─── IPC — Config ─────────────────────────────────────────────────────────────

ipcMain.handle('read-config-file', () => {
  return readConfig()
})

ipcMain.handle('select-library-root', async () => {
  const dialogResult = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  })
  if (dialogResult.canceled) return null

  const selectedLibraryRoot = dialogResult.filePaths[0]
  writeConfig({ libraryRoot: selectedLibraryRoot })
  rebuildIndex()

  return selectedLibraryRoot
})

ipcMain.handle('change-library-root', async () => {
  const dialogResult = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  })
  if (dialogResult.canceled) return null

  const selectedLibraryRoot = dialogResult.filePaths[0]
  writeConfig({ libraryRoot: selectedLibraryRoot })
  rebuildIndex()

  return {
    libraryRoot: selectedLibraryRoot,
    folders: scanManifests(selectedLibraryRoot).map(withMissingFlags)
  }
})

ipcMain.handle('library-root-exists', (_event, libraryRootPath: string): boolean => {
  return fs.existsSync(libraryRootPath)
})

// ─── IPC — Profile ────────────────────────────────────────────────────────────

ipcMain.handle('update-profile', (_event, { username, avatarSourcePath }: UpdateProfileArgs) => {
  const updates: Partial<AppConfig> = { username }

  if (avatarSourcePath) {
    const avatarDestination = path.join(app.getPath('userData'), 'avatar.jpg')
    fs.copyFileSync(avatarSourcePath, avatarDestination)
    updates.avatarPath = avatarDestination
  }

  writeConfig(updates)
  return readConfig()
})

// ─── IPC — Folders ────────────────────────────────────────────────────────────

ipcMain.handle('create-folder', async (_event, { name, type, artist }: CreateFolderArgs) => {
  const config = readConfig()

  const folderPath = path.join(config.libraryRoot!, `${name}-${randomUUID()}`)
  fs.mkdirSync(folderPath, { recursive: true })

  const manifest: Manifest = {
    name,
    type,
    artist,
    artwork: '',
    totalTracks: 0,
    folderPath,
    tracks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  fs.writeFileSync(manifestPathFor(folderPath), JSON.stringify(manifest, null, 2))
  insertFolderRow(manifest)

  return manifest
})

ipcMain.handle(
  'upload-artwork',
  (_event, { folderPath, filePath }: { folderPath: string; filePath: string }) => {
    const artworkDestination = path.join(folderPath, 'artwork.jpg')
    fs.copyFileSync(filePath, artworkDestination)

    const manifest = readManifest(folderPath)
    manifest.artwork = 'artwork.jpg'
    writeManifest(folderPath, manifest)

    db.prepare('UPDATE folders SET artwork = ?, updatedAt = ? WHERE folderPath = ?').run(
      'artwork.jpg',
      manifest.updatedAt,
      folderPath
    )

    return withMissingFlags(manifest)
  }
)

ipcMain.handle('update-folder', (_event, { folderPath, name, artist, type }: UpdateFolderArgs) => {
  const manifest = readManifest(folderPath)
  let newFolderPath = folderPath

  if (name !== manifest.name) {
    // Folder dirs are "<name>-<uuid>"; keep the uuid suffix when renaming
    const basename = path.basename(folderPath)
    const uuidSuffix = basename.slice(-36)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      uuidSuffix
    )
    newFolderPath = path.join(
      path.dirname(folderPath),
      `${name}-${isUuid ? uuidSuffix : randomUUID()}`
    )
    fs.renameSync(folderPath, newFolderPath)
  }

  manifest.name = name
  manifest.artist = artist
  manifest.type = type
  manifest.folderPath = newFolderPath
  writeManifest(newFolderPath, manifest)

  const applyUpdate = db.transaction(() => {
    db.prepare(
      'UPDATE folders SET name = ?, artist = ?, type = ?, folderPath = ?, updatedAt = ? WHERE folderPath = ?'
    ).run(name, artist, type, newFolderPath, manifest.updatedAt, folderPath)
    db.prepare('UPDATE tracks SET folderPath = ? WHERE folderPath = ?').run(
      newFolderPath,
      folderPath
    )
  })
  applyUpdate()

  return withMissingFlags(manifest)
})

ipcMain.handle('get-folders', async () => {
  const { libraryRoot } = readConfig()
  if (!libraryRoot) return []
  return scanManifests(libraryRoot).map(withMissingFlags)
})

// ─── IPC — Tracks ─────────────────────────────────────────────────────────────

const AUDIO_EXTENSIONS = ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'opus', 'webm', 'aiff']

ipcMain.handle('add-tracks', async (_event, folderPath: string) => {
  const dialogResult = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Audio Files', extensions: AUDIO_EXTENSIONS }]
  })
  if (dialogResult.canceled || dialogResult.filePaths.length === 0) return null

  const manifest = readManifest(folderPath)
  const folderId = folderIdFor(folderPath)
  const newTracks: TrackEntry[] = []

  for (const sourcePath of dialogResult.filePaths) {
    const destinationPath = uniqueDestination(folderPath, path.basename(sourcePath))
    fs.copyFileSync(sourcePath, destinationPath)

    let duration = 0
    try {
      const metadata = await parseFile(destinationPath)
      duration = Math.round(metadata.format.duration ?? 0)
    } catch (error) {
      console.error('Error parsing metadata:', error)
    }

    const filename = path.basename(destinationPath)
    newTracks.push({
      filename,
      title: filename.replace(/\.[^/.]+$/, ''),
      artist: manifest.artist ?? '',
      duration,
      trackOrder: manifest.tracks.length + newTracks.length + 1,
      addedAt: new Date().toISOString()
    })
  }

  manifest.tracks = [...manifest.tracks, ...newTracks]
  manifest.totalTracks = manifest.tracks.length
  writeManifest(folderPath, manifest)

  const applyInserts = db.transaction(() => {
    if (folderId !== null) {
      for (const track of newTracks) insertTrackRow(folderId, folderPath, track)
    }
    db.prepare('UPDATE folders SET totalTracks = ?, updatedAt = ? WHERE folderPath = ?').run(
      manifest.totalTracks,
      manifest.updatedAt,
      folderPath
    )
  })
  applyInserts()

  return withMissingFlags(manifest)
})

ipcMain.handle(
  'reorder-tracks',
  (_event, { folderPath, filenames }: { folderPath: string; filenames: string[] }) => {
    const manifest = readManifest(folderPath)
    const byFilename = new Map(manifest.tracks.map((track) => [track.filename, track]))

    const reordered: TrackEntry[] = []
    filenames.forEach((filename) => {
      const track = byFilename.get(filename)
      if (track) {
        track.trackOrder = reordered.length + 1
        reordered.push(track)
        byFilename.delete(filename)
      }
    })
    // Any tracks not present in the new order keep their relative order at the end
    byFilename.forEach((track) => {
      track.trackOrder = reordered.length + 1
      reordered.push(track)
    })

    manifest.tracks = reordered
    manifest.totalTracks = reordered.length
    writeManifest(folderPath, manifest)

    const applyOrder = db.transaction(() => {
      const update = db.prepare(
        'UPDATE tracks SET trackOrder = ? WHERE folderPath = ? AND filename = ?'
      )
      for (const track of reordered) update.run(track.trackOrder, folderPath, track.filename)
    })
    applyOrder()

    return withMissingFlags(manifest)
  }
)

ipcMain.handle(
  'delete-track',
  (_event, { folderPath, filename }: { folderPath: string; filename: string }) => {
    const trackFilePath = path.join(folderPath, filename)
    if (fs.existsSync(trackFilePath)) {
      fs.unlinkSync(trackFilePath)
    }

    const manifest = readManifest(folderPath)
    manifest.tracks = manifest.tracks
      .filter((track) => track.filename !== filename)
      .sort((a, b) => a.trackOrder - b.trackOrder)
      .map((track, index) => ({ ...track, trackOrder: index + 1 }))
    manifest.totalTracks = manifest.tracks.length
    writeManifest(folderPath, manifest)

    const applyDelete = db.transaction(() => {
      db.prepare('DELETE FROM tracks WHERE folderPath = ? AND filename = ?').run(
        folderPath,
        filename
      )
      const update = db.prepare(
        'UPDATE tracks SET trackOrder = ? WHERE folderPath = ? AND filename = ?'
      )
      for (const track of manifest.tracks) update.run(track.trackOrder, folderPath, track.filename)
      db.prepare('UPDATE folders SET totalTracks = ?, updatedAt = ? WHERE folderPath = ?').run(
        manifest.totalTracks,
        manifest.updatedAt,
        folderPath
      )
    })
    applyDelete()

    return withMissingFlags(manifest)
  }
)

ipcMain.handle(
  'update-track',
  (_event, { folderPath, filename, title, artist, newFilename }: UpdateTrackArgs) => {
    const manifest = readManifest(folderPath)
    const track = manifest.tracks.find((entry) => entry.filename === filename)
    if (!track) return withMissingFlags(manifest)

    let finalFilename = filename
    if (newFilename && newFilename !== filename) {
      const oldPath = path.join(folderPath, filename)
      const newPath = uniqueDestination(folderPath, newFilename)
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath)
      }
      finalFilename = path.basename(newPath)
    }

    track.filename = finalFilename
    track.title = title
    track.artist = artist
    writeManifest(folderPath, manifest)

    db.prepare(
      'UPDATE tracks SET title = ?, artist = ?, filename = ? WHERE folderPath = ? AND filename = ?'
    ).run(title, artist, finalFilename, folderPath, filename)

    return withMissingFlags(manifest)
  }
)

// ─── IPC — Search ─────────────────────────────────────────────────────────────

ipcMain.handle('search-library', (_event, query: string): SearchResult[] => {
  const trimmed = query.trim()
  if (!trimmed) return []
  const like = `%${trimmed}%`

  const folderRows = db
    .prepare(
      `SELECT name, artist, folderPath FROM folders
       WHERE name LIKE ? OR artist LIKE ?
       ORDER BY name LIMIT 20`
    )
    .all(like, like) as { name: string; artist: string; folderPath: string }[]

  const trackRows = db
    .prepare(
      `SELECT tracks.title AS title, tracks.artist AS artist, tracks.filename AS filename,
              folders.name AS folderName, folders.folderPath AS folderPath
       FROM tracks JOIN folders ON tracks.folderId = folders.id
       WHERE tracks.title LIKE ? OR tracks.artist LIKE ? OR folders.name LIKE ?
       ORDER BY tracks.title LIMIT 30`
    )
    .all(like, like, like) as {
    title: string
    artist: string
    filename: string
    folderName: string
    folderPath: string
  }[]

  return [
    ...folderRows.map(
      (row): SearchResult => ({
        kind: 'folder',
        folderPath: row.folderPath,
        folderName: row.name,
        title: row.name,
        artist: row.artist,
        filename: null
      })
    ),
    ...trackRows.map(
      (row): SearchResult => ({
        kind: 'track',
        folderPath: row.folderPath,
        folderName: row.folderName,
        title: row.title,
        artist: row.artist,
        filename: row.filename
      })
    )
  ]
})

// ─── IPC — Index ──────────────────────────────────────────────────────────────

ipcMain.handle('rebuild-index', () => {
  return rebuildIndex()
})

// ─── Cleanup ──────────────────────────────────────────────────────────────────

app.on('window-all-closed', () => {
  db.close()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

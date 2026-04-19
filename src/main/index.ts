import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { CreateFolderArgs } from '@shared/types'
import Database from 'better-sqlite3'
import { app, BrowserWindow, dialog, ipcMain, net, protocol, shell } from 'electron'
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

// ─── App Ready ────────────────────────────────────────────────────────────────

protocol.registerSchemesAsPrivileged([
  { scheme: 'localfile', privileges: { secure: true, supportFetchAPI: true } }
])

app.whenReady().then(() => {
  protocol.handle('localfile', (request) => {
    const filePath = decodeURIComponent(request.url.slice('localfile://'.length))
    return net.fetch(`file://${filePath}`)
  })
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ─── Config ─────────────────────────────────────────────────────────────

  const configFileExists = fs.existsSync(path.join(app.getPath('userData'), 'config.json'))
  if (!configFileExists) {
    fs.writeFileSync(
      path.join(app.getPath('userData'), 'config.json'),
      JSON.stringify({ libraryRoot: null }, null, 2)
    )
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

  // ─── Launch ─────────────────────────────────────────────────────────────

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// ─── IPC — Config ─────────────────────────────────────────────────────────────

ipcMain.handle('read-config-file', () => {
  const configFile = JSON.parse(
    fs.readFileSync(path.join(app.getPath('userData'), 'config.json'), 'utf-8')
  )
  return configFile
})

ipcMain.handle('select-library-root', async () => {
  const dialogResult = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  })
  if (dialogResult.canceled) return null

  const selectedLibraryRoot = dialogResult.filePaths[0]

  fs.writeFileSync(
    path.join(app.getPath('userData'), 'config.json'),
    JSON.stringify({ libraryRoot: selectedLibraryRoot }, null, 2)
  )

  return selectedLibraryRoot
})

ipcMain.handle('library-root-exists', (_event, libraryRootPath: string): boolean => {
  return fs.existsSync(libraryRootPath)
})

// ─── IPC — Folders ────────────────────────────────────────────────────────────

ipcMain.handle('create-folder', async (_event, { name, type, artist }: CreateFolderArgs) => {
  const config = JSON.parse(
    fs.readFileSync(path.join(app.getPath('userData'), 'config.json'), 'utf-8')
  )

  const folderPath = path.join(config.libraryRoot, name)
  fs.mkdirSync(folderPath, { recursive: true })

  const manifest = {
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

  fs.writeFileSync(path.join(folderPath, '.manifest.json'), JSON.stringify(manifest, null, 2))

  db.prepare(
    `
    INSERT INTO folders (name, type, artist, artwork, folderPath, totalTracks, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(name, type, artist, '', folderPath, 0, manifest.createdAt, manifest.updatedAt)

  return manifest
})

ipcMain.handle(
  'upload-artwork',
  (_event, { folderPath, filePath }: { folderPath: string; filePath: string }) => {
    const artworkDestination = path.join(folderPath, 'artwork.jpg')
    fs.copyFileSync(filePath, artworkDestination)

    const manifestPath = path.join(folderPath, '.manifest.json')
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    manifest.artwork = 'artwork.jpg'
    manifest.updatedAt = new Date().toISOString()
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

    return manifest
  }
)

ipcMain.handle('get-folders', async () => {
  const config = JSON.parse(
    fs.readFileSync(path.join(app.getPath('userData'), 'config.json'), 'utf-8')
  )

  const folderPath = config.libraryRoot
  const subFolders = fs.readdirSync(folderPath, { withFileTypes: true })

  const manifests = await Promise.all(
    subFolders
      .filter((subFolder) => subFolder.isDirectory())
      .map(async (subFolder) => {
        const manifestPath = path.join(folderPath, subFolder.name, '.manifest.json')
        if (!fs.existsSync(manifestPath)) return null
        const contents = await fs.promises.readFile(manifestPath, 'utf-8')
        return JSON.parse(contents)
      })
  )

  return manifests.filter(Boolean)
})

// ─── Cleanup ──────────────────────────────────────────────────────────────────

app.on('window-all-closed', () => {
  db.close()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

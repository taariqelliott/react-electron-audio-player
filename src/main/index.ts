import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { CreateFolderArgs } from '@shared/types'
import Database from 'better-sqlite3'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import fs from 'node:fs'
import path, { join } from 'node:path'
import icon from '../../resources/icon.png?asset'

let db: Database.Database

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
    }
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

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ─── Config ───────────────────────────────────────────────────────────────

  const configFileExists = fs.existsSync(path.join(app.getPath('userData'), 'config.json'))
  if (!configFileExists) {
    fs.writeFileSync(
      path.join(app.getPath('userData'), 'config.json'),
      JSON.stringify({ libraryRoot: null }, null, 2)
    )
  }

  // ─── Database ─────────────────────────────────────────────────────────────

  const databasePath = path.join(app.getPath('userData'), 'database.db')
  console.log('DB location:', app.getPath('userData'))
  db = new Database(databasePath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id          INTEGER   PRIMARY KEY AUTOINCREMENT,
      name        TEXT      NOT NULL,
      type        TEXT      NOT NULL,
      artist      TEXT      NOT NULL,
      artwork     TEXT      NOT NULL,
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

  const folders = db.prepare('SELECT * FROM folders').all()
  const tracks = db.prepare('SELECT * FROM tracks').all()
  console.log('Folders:', folders)
  console.log('Tracks:', tracks)

  // ─── Window ───────────────────────────────────────────────────────────────

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

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

ipcMain.handle('read-config-file', () => {
  const configFile = JSON.parse(
    fs.readFileSync(path.join(app.getPath('userData'), 'config.json'), 'utf-8')
  )
  return configFile
})

ipcMain.handle('create-folder', async (_event, { name, type, artist }: CreateFolderArgs) => {
  const config = JSON.parse(
    fs.readFileSync(path.join(app.getPath('userData'), 'config.json'), 'utf-8')
  )

  const newFolderPath = path.join(config.libraryRoot, name)
  fs.mkdirSync(newFolderPath, { recursive: true })

  const manifest = {
    name,
    type,
    artist,
    artwork: '',
    totalTracks: 0,
    tracks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  fs.writeFileSync(path.join(newFolderPath, '.manifest.json'), JSON.stringify(manifest, null, 2))

  return manifest
})

ipcMain.handle('library-root-exists', (_event, libraryRootPath: string): boolean => {
  const libraryRootExists = fs.existsSync(libraryRootPath)
  return libraryRootExists
})

// ─── Cleanup ──────────────────────────────────────────────────────────────────

app.on('window-all-closed', () => {
  db.close()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

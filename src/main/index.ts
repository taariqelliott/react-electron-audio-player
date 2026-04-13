import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import Database from 'better-sqlite3'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import fs from 'node:fs'
import path, { join } from 'node:path'
import icon from '../../resources/icon.png?asset'
import { dialog } from 'electron'

let db: Database.Database

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 870,
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

  // ─── Database & Config ─────────────────────────────────────────────────────────────

  const configExists = fs.existsSync(path.join(app.getPath('userData'), 'config.json'))
  if (!configExists) {
    fs.writeFileSync(
      path.join(app.getPath('userData'), 'config.json'),
      JSON.stringify({ libraryRoot: null }, null, 2)
    )
  }

  const dbPath = path.join(app.getPath('userData'), 'database.db')
  console.log('DB location:', app.getPath('userData'))
  db = new Database(dbPath)
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

ipcMain.handle('select-library-root', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  })
  if (result.canceled) return null
  const libraryRoot = result.filePaths[0]

  fs.writeFileSync(
    path.join(app.getPath('userData'), 'config.json'),
    JSON.stringify({ libraryRoot }, null, 2)
  )
  return libraryRoot
})

ipcMain.handle('read-config-file', () => {
  const configFile = JSON.parse(
    fs.readFileSync(path.join(app.getPath('userData'), 'config.json'), 'utf-8')
  )
  return configFile
})

app.on('window-all-closed', () => {
  db.close()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

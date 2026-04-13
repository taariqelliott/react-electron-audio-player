import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { faker } from '@faker-js/faker'
import Database from 'better-sqlite3'
import { app, BrowserWindow, shell } from 'electron'
import path, { join } from 'path'
import icon from '../../resources/icon.png?asset'

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

  // ─── Database ─────────────────────────────────────────────────────────────

  const dbPath = path.join(app.getPath('userData'), 'database.db')
  console.log('DB location:', app.getPath('userData'))
  db = new Database(dbPath)

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      name  TEXT    NOT NULL,
      email TEXT    NOT NULL
    )
  `)

  if (!app.isPackaged) {
    const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
    db.prepare('DELETE FROM users').run()
    for (let i = 0; i < 1500; i++) {
      insert.run(faker.person.firstName(), faker.internet.email())
    }
  }

  const rows = db.prepare('SELECT * FROM users').all()
  console.log(rows)

  // ─── Window ───────────────────────────────────────────────────────────────

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  db.close()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

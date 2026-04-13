import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import Database from 'better-sqlite3'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import fs from 'fs'
import path, { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { faker } from '@faker-js/faker'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
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

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// console.log(__dirname)

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // if (app.isPackaged) {
  //   console.log('App is in prod mode.')
  // } else {
  //   console.log('App is dev mode')
  // }

  const dbPath = path.join(app.getPath('userData'), 'database.db')
  let dbFileExists = false
  fs.readdirSync(app.getPath('userData')).some((file) => {
    if (file === 'database.db') {
      console.log('Database file exists.')
      dbFileExists = true
      return
    }
  })

  if (!dbFileExists) {
    console.log('Creating new DB file at:', app.getPath('userData'))
    const db = new Database(dbPath)
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL
        )
        `)
    db.close()
  }

  // Connect to DB
  const db = new Database(dbPath)
  const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
  db.prepare('DELETE FROM users').run()
  for (let i = 0; i < 15; i++) {
    insert.run(faker.person.firstName(), faker.internet.email())
  }
  const rows = db.prepare('SELECT * FROM users').all()
  console.log(rows)
  db.close()

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  // ipcMain.
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

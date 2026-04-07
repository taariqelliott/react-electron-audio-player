import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer

const bridge = {
  logTaariq: () => {
    console.log('Taariq')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('logger', {
      logNumber: (number: number) => {
        console.log(`Number: ${Math.floor(Math.random() * number)}`)
      }
    })
    contextBridge.exposeInMainWorld('bridge', bridge)
    contextBridge.exposeInMainWorld('versions', {
      node: () => process.versions.node,
      chrome: () => process.versions.chrome,
      electron: () => process.versions.electron
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI

  // @ts-ignore
  window.bridge = bridge

  // @ts-ignore
  window.versions = {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
  }

  // @ts-ignore
  window.logger = {
    logNumber: (number: number) => {
      console.log(`Number: ${Math.floor(Math.random() * number)}`)
    }
  }
}

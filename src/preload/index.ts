import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', {
      selectLibraryRoot: () => ipcRenderer.invoke('select-library-root'),
      readConfigFile: () => ipcRenderer.invoke('read-config-file')
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.api = {
    selectLibraryRoot: () => ipcRenderer.invoke('select-library-root'),
    readConfigFile: () => ipcRenderer.invoke('read-config-file')
  }
}

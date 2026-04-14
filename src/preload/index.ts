import { electronAPI } from '@electron-toolkit/preload'
import { CreateFolderArgs } from '@shared/types'
import { contextBridge, ipcRenderer } from 'electron'

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('musicPlayer', {
      selectLibraryRoot: () => ipcRenderer.invoke('select-library-root'),
      readConfigFile: () => ipcRenderer.invoke('read-config-file'),
      createFolder: (args: CreateFolderArgs) => ipcRenderer.invoke('create-folder', args),
      libraryRootExists: (path: string) => ipcRenderer.invoke('library-root-exists', path)
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.musicPlayer = {
    selectLibraryRoot: () => ipcRenderer.invoke('select-library-root'),
    readConfigFile: () => ipcRenderer.invoke('read-config-file'),
    createFolder: (args: CreateFolderArgs) => ipcRenderer.invoke('create-folder', args),
    libraryRootExists: (path: string) => ipcRenderer.invoke('library-root-exists', path)
  }
}

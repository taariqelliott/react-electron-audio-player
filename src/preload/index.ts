import { electronAPI } from '@electron-toolkit/preload'
import { CreateFolderArgs } from '@shared/types'
import { contextBridge, ipcRenderer, webUtils } from 'electron'

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    contextBridge.exposeInMainWorld('musicPlayer', {
      selectLibraryRoot: () => ipcRenderer.invoke('select-library-root'),
      readConfigFile: () => ipcRenderer.invoke('read-config-file'),
      createFolder: (args: CreateFolderArgs) => ipcRenderer.invoke('create-folder', args),
      libraryRootExists: (path: string) => ipcRenderer.invoke('library-root-exists', path),
      getFolders: () => ipcRenderer.invoke('get-folders'),
      uploadArtwork: (args: { folderPath: string; filePath: string }) =>
        ipcRenderer.invoke('upload-artwork', args),
      getFilePath: (file: File) => webUtils.getPathForFile(file)
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
    libraryRootExists: (path: string) => ipcRenderer.invoke('library-root-exists', path),
    getFolders: () => ipcRenderer.invoke('get-folders'),
    uploadArtwork: (args: { folderPath: string; filePath: string }) =>
      ipcRenderer.invoke('upload-artwork', args),
    getFilePath: (file: File) => webUtils.getPathForFile(file)
  }
}

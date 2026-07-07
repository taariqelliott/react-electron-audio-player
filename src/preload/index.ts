import { electronAPI } from '@electron-toolkit/preload'
import {
  CreateFolderArgs,
  UpdateFolderArgs,
  UpdateProfileArgs,
  UpdateTrackArgs
} from '@shared/types'
import { contextBridge, ipcRenderer, webUtils } from 'electron'

const musicPlayerApi = {
  selectLibraryRoot: () => ipcRenderer.invoke('select-library-root'),
  readConfigFile: () => ipcRenderer.invoke('read-config-file'),
  createFolder: (args: CreateFolderArgs) => ipcRenderer.invoke('create-folder', args),
  libraryRootExists: (path: string) => ipcRenderer.invoke('library-root-exists', path),
  getFolders: () => ipcRenderer.invoke('get-folders'),
  uploadArtwork: (args: { folderPath: string; filePath: string }) =>
    ipcRenderer.invoke('upload-artwork', args),
  getFilePath: (file: File) => webUtils.getPathForFile(file),
  addTracks: (folderPath: string) => ipcRenderer.invoke('add-tracks', folderPath),
  reorderTracks: (args: { folderPath: string; filenames: string[] }) =>
    ipcRenderer.invoke('reorder-tracks', args),
  deleteTrack: (args: { folderPath: string; filename: string }) =>
    ipcRenderer.invoke('delete-track', args),
  updateTrack: (args: UpdateTrackArgs) => ipcRenderer.invoke('update-track', args),
  updateFolder: (args: UpdateFolderArgs) => ipcRenderer.invoke('update-folder', args),
  searchLibrary: (query: string) => ipcRenderer.invoke('search-library', query),
  rebuildIndex: () => ipcRenderer.invoke('rebuild-index'),
  changeLibraryRoot: () => ipcRenderer.invoke('change-library-root'),
  updateProfile: (args: UpdateProfileArgs) => ipcRenderer.invoke('update-profile', args)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('musicPlayer', musicPlayerApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.musicPlayer = musicPlayerApi
}

import { create } from 'zustand'
import { Manifest } from './types'

type State = {
  folders: Manifest[]
  activeFolder: Manifest | null
  activeTrackFilename: string | null
}

type Action = {
  setFolders: (folders: Manifest[]) => void
  addFolder: (folder: Manifest) => void
  updateActiveFolder: (activeFolder: Manifest | null) => void
  setActiveTrackFilename: (filename: string | null) => void
  applyManifest: (manifest: Manifest, oldFolderPath?: string) => void
}

export const useAlbumStore = create<State & Action>((set) => ({
  folders: [],
  activeFolder: null,
  activeTrackFilename: null,
  setFolders: (folders) => set({ folders }),
  addFolder: (folder) => set((state) => ({ folders: [...state.folders, folder] })),
  updateActiveFolder: (activeFolder) => set({ activeFolder }),
  setActiveTrackFilename: (filename) => set({ activeTrackFilename: filename }),
  applyManifest: (manifest, oldFolderPath) =>
    set((state) => {
      const matchPath = oldFolderPath ?? manifest.folderPath
      const exists = state.folders.some((folder) => folder.folderPath === matchPath)
      const folders = exists
        ? state.folders.map((folder) => (folder.folderPath === matchPath ? manifest : folder))
        : [...state.folders, manifest]
      const activeFolder =
        state.activeFolder?.folderPath === matchPath ? manifest : state.activeFolder
      return { folders, activeFolder }
    })
}))

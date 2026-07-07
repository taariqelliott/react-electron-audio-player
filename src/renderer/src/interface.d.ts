import {
  AppConfig,
  CreateFolderArgs,
  Manifest,
  SearchResult,
  UpdateFolderArgs,
  UpdateProfileArgs,
  UpdateTrackArgs
} from '@shared/types'

declare global {
  interface Window {
    musicPlayer: {
      selectLibraryRoot: () => Promise<string | null>
      readConfigFile: () => Promise<AppConfig>
      createFolder: (args: CreateFolderArgs) => Promise<Manifest>
      libraryRootExists: (path: string) => Promise<boolean>
      getFolders: () => Promise<Manifest[]>
      uploadArtwork: (args: { folderPath: string; filePath: string }) => Promise<Manifest>
      getFilePath: (file: File) => string
      addTracks: (folderPath: string) => Promise<Manifest | null>
      reorderTracks: (args: { folderPath: string; filenames: string[] }) => Promise<Manifest>
      deleteTrack: (args: { folderPath: string; filename: string }) => Promise<Manifest>
      updateTrack: (args: UpdateTrackArgs) => Promise<Manifest>
      updateFolder: (args: UpdateFolderArgs) => Promise<Manifest>
      searchLibrary: (query: string) => Promise<SearchResult[]>
      rebuildIndex: () => Promise<{ folders: number; tracks: number }>
      changeLibraryRoot: () => Promise<{ libraryRoot: string; folders: Manifest[] } | null>
      updateProfile: (args: UpdateProfileArgs) => Promise<AppConfig>
    }
  }
}

export {}

import { AppConfig, CreateFolderArgs, Manifest } from '@shared/types'

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
    }
  }
}

export {}

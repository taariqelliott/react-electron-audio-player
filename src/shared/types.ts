export type AppConfig = {
  libraryRoot: string | null
}

export type CreateFolderArgs = {
  name: string
  type: string
  artist: string
}

export type Manifest = {
  name: string
  type: string
  artist: string
  artwork: string
  folderPath: string
  totalTracks: number
  tracks: string[]
  createdAt: string
  updatedAt: string
}

export type SetupScreenProps = {
  libraryRootIsNull: boolean
  onSelectLibraryRoot: () => void
}

export type CreateFolderFormProps = {
  folderName: string
  folderType: string
  folderArtist: string
  onFolderNameChange: (value: string) => void
  onFolderTypeChange: (value: string) => void
  onFolderArtistChange: (value: string) => void
  onCreateFolder: () => void
}

export type FolderListProps = {
  folders: Manifest[]
}

declare global {
  interface Window {
    musicPlayer: {
      selectLibraryRoot: () => Promise<string | null>
      readConfigFile: () => Promise<AppConfig>
      createFolder: (args: CreateFolderArgs) => Promise<Manifest>
      libraryRootExists: (path: string) => Promise<boolean>
    }
  }
}

export {}

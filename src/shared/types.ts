export type AppConfig = {
  libraryRoot: string | null
}

export type CreateFolderArgs = {
  artist: string
  name: string
  type: string
}

export type Manifest = {
  artist: string
  artwork: string
  createdAt: string
  folderPath: string
  name: string
  type: string
  updatedAt: string
  totalTracks: number
  tracks: string[]
}

export type SetupScreenProps = {
  libraryRootIsNull: boolean
  onSelectLibraryRoot: () => void
}

export type CreateFolderFormProps = {
  folderArtist: string
  folderName: string
  folderType: string
  onCreateFolder: () => void
  onFolderArtistChange: (value: string) => void
  onFolderArtworkChange: (file: File | null) => void
  onFolderNameChange: (value: string) => void
  onFolderTypeChange: (value: string) => void
}

export type FolderListProps = {
  folders: Manifest[]
}

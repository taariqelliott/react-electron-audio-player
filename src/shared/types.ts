export type AppConfig = {
  libraryRoot: string | null
  username?: string
  avatarPath?: string | null
}

export type UpdateProfileArgs = {
  username: string
  avatarSourcePath?: string
}

export type CreateFolderArgs = {
  artist: string
  name: string
  type: string
}

export type TrackEntry = {
  filename: string
  title: string
  artist: string
  duration: number
  trackOrder: number
  addedAt: string
  missing?: boolean
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
  tracks: TrackEntry[]
}

export type UpdateTrackArgs = {
  folderPath: string
  filename: string
  title: string
  artist: string
  newFilename?: string
}

export type UpdateFolderArgs = {
  folderPath: string
  name: string
  artist: string
  type: string
}

export type SearchResult = {
  kind: 'folder' | 'track'
  folderPath: string
  folderName: string
  title: string
  artist: string
  filename: string | null
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

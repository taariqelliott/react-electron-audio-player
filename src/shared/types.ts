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

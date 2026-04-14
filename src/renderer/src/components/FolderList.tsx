import { FolderListProps } from '@shared/types'
import { JSX } from 'react'

export function FolderList({ folders }: FolderListProps): JSX.Element {
  return (
    <div className="flex items-center justify-center gap-2">
      {folders.map(({ artist, artwork, createdAt, name, totalTracks, tracks, type }) => (
        <div
          className="flex items-center justify-center flex-col gap-1 rounded bg-primary text-primary-foreground w-48"
          key={`${artist}-${name}-${createdAt}`}
        >
          <p>Artist: {artist}</p>
          <p>Artwork: {artwork}</p>
          <p>Name: {name}</p>
          <p>
            Tracks:
            {tracks.map((track) => (
              <p key={track}>{track}</p>
            ))}
          </p>
          <p>Type: {type}</p>
          <p>Total tracks: {totalTracks}</p>
        </div>
      ))}
    </div>
  )
}

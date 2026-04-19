import { useAlbumStore } from '@shared/store'
import { FolderListProps } from '@shared/types'
import { DiscIcon } from 'lucide-react'
import { JSX, useEffect } from 'react'
import { Badge } from './ui/badge'

export function FolderList({ folders }: FolderListProps): JSX.Element {
  const activeAlbumName = useAlbumStore((state) => state.activeAlbumName)
  const updateActiveAlbum = useAlbumStore((state) => state.updateActiveAlbum)

  useEffect(() => {
    if (!folders || folders.length === 0) return
    if (activeAlbumName === '') {
      updateActiveAlbum(`${folders![0].name}-${folders![0].createdAt}`)
    }
  }, [folders, activeAlbumName, updateActiveAlbum])

  return (
    <div className="flex flex-wrap gap-4 p-4">
      {folders.map(({ artist, artwork, createdAt, name, totalTracks, folderPath, type }) => (
        <div
          onClick={() => {
            updateActiveAlbum(`${name}-${createdAt}`)
          }}
          className="flex flex-col rounded-lg overflow-hidden bg-primary text-primary-foreground w-48 cursor-pointer hover:opacity-90 transition-opacity"
          key={`${artist}-${name}-${createdAt}`}
        >
          {artwork ? (
            <img
              src={`localfile://${folderPath}/artwork.jpg`}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-primary-foreground/10 flex items-center justify-center">
              <p className="text-primary-foreground/40 text-xs">No artwork</p>
            </div>
          )}
          <div className="flex flex-col gap-1 p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm truncate">{name}</p>
              <DiscIcon
                className={activeAlbumName === `${name}-${createdAt}` ? 'opacity-100' : 'opacity-0'}
              />
            </div>
            <p className="text-xs text-primary-foreground/60 truncate">{artist}</p>
            <div className="flex items-center justify-between mt-1">
              <Badge variant="secondary">{type}</Badge>
              <p className="text-xs text-primary-foreground/40">{totalTracks} tracks</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

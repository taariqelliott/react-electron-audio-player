import { useAlbumStore } from '@shared/store'
import { FolderListProps } from '@shared/types'
import { DiscIcon } from 'lucide-react'
import { JSX, useEffect } from 'react'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'

export function FolderList({ folders }: FolderListProps): JSX.Element {
  const activeAlbumName = useAlbumStore((state) => state.activeAlbumName)
  const updateActiveAlbum = useAlbumStore((state) => state.updateActiveAlbum)

  useEffect(() => {
    if (!folders || folders.length === 0) return
    if (useAlbumStore.getState().activeAlbumName === '') {
      updateActiveAlbum(`${folders[0].name}-${folders[0].createdAt}`)
    }
  }, [folders, updateActiveAlbum])

  return (
    <div className="flex flex-wrap gap-4 p-4 justify-center">
      {folders.map(({ artist, artwork, createdAt, name, totalTracks, folderPath, type }) => (
        <Card
          onClick={() => updateActiveAlbum(`${name}-${createdAt}`)}
          key={`${artist}-${name}-${createdAt}`}
          className="group relative w-48 h-48 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity bg-primary border-none"
        >
          <CardContent className="p-0 w-full h-full">
            {artwork ? (
              <img
                src={`localfile://${folderPath}/artwork.jpg`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-primary-foreground/40 text-xs">No artwork</p>
              </div>
            )}
            <div className="absolute inset-0 bg-black/15" />
            <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{type}</Badge>
                <DiscIcon
                  size={16}
                  className={`text-white ${activeAlbumName === `${name}-${createdAt}` ? 'opacity-100' : 'opacity-0'}`}
                />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-2 bg-black/40 backdrop-blur-md opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <p className="text-white font-medium text-sm truncate">{name}</p>
              <p className="text-white/60 text-xs truncate">{artist}</p>
              <p className="text-white/40 text-xs">{totalTracks} tracks</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

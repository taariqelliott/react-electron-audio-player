import { useAlbumStore } from '@shared/store'
import { Manifest } from '@shared/types'
import { JSX, useEffect } from 'react'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'

export default function ActiveFolder({ folders }: { folders: Manifest[] }): JSX.Element {
  const activeAlbumName = useAlbumStore((state) => state.activeAlbumName)

  const activeFolder =
    folders.find((folder) => `${folder.name}-${folder.createdAt}` === activeAlbumName) ?? null

  useEffect(() => {
    if (!activeFolder) return
    console.log('Active folder:', activeFolder)
  }, [activeFolder, folders])

  if (!activeFolder) return <div />

  const { artist, folderPath, name, type } = activeFolder

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4 w-96 justify-center">
        <p className="font-medium text-sm">{name}</p>
        <p className="text-sm text-muted-foreground">{artist}</p>
        <Badge variant="secondary">{type}</Badge>
        <img
          src={`localfile://${folderPath}/artwork.jpg`}
          className="w-[50px] h-[50px] object-cover rounded"
        />
      </CardContent>
    </Card>
  )
}

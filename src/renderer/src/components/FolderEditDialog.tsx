import { useAlbumStore } from '@shared/store'
import { Manifest } from '@shared/types'
import { ImagePlus } from 'lucide-react'
import { ChangeEvent, JSX, useRef, useState } from 'react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

const RELEASE_TYPES = ['Album', 'EP', 'Single', 'Mixtape', 'Playlist', 'Compilation']

type FolderEditDialogProps = {
  folder: Manifest | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FolderEditDialog({
  folder,
  open,
  onOpenChange
}: FolderEditDialogProps): JSX.Element {
  if (!folder) return <></>
  return (
    <FolderEditForm
      key={`${folder.folderPath}-${open}`}
      folder={folder}
      open={open}
      onOpenChange={onOpenChange}
    />
  )
}

function FolderEditForm({
  folder,
  open,
  onOpenChange
}: FolderEditDialogProps & { folder: NonNullable<FolderEditDialogProps['folder']> }): JSX.Element {
  const applyManifest = useAlbumStore((state) => state.applyManifest)
  const [name, setName] = useState(folder.name)
  const [artist, setArtist] = useState(folder.artist)
  const [type, setType] = useState(folder.type)
  const [isSaving, setIsSaving] = useState(false)
  const artworkInputRef = useRef<HTMLInputElement>(null)

  const typeOptions =
    RELEASE_TYPES.includes(type) || !type ? RELEASE_TYPES : [type, ...RELEASE_TYPES]

  const handleArtworkChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) return
    const filePath = window.musicPlayer.getFilePath(file)
    const updated = await window.musicPlayer.uploadArtwork({
      folderPath: folder.folderPath,
      filePath
    })
    applyManifest(updated)
    event.target.value = ''
  }

  const handleSave = async (): Promise<void> => {
    if (!name.trim()) return
    setIsSaving(true)
    try {
      const updated = await window.musicPlayer.updateFolder({
        folderPath: folder.folderPath,
        name: name.trim(),
        artist: artist.trim(),
        type
      })
      applyManifest(updated, folder.folderPath)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit folder</DialogTitle>
          <DialogDescription>
            Update the folder details. Renaming moves the folder on disk.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="editFolderName">Name</Label>
            <Input
              id="editFolderName"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="editFolderArtist">Artist</Label>
            <Input
              id="editFolderArtist"
              value={artist}
              onChange={(event) => setArtist(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Release Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as string)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Artwork</Label>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => artworkInputRef.current?.click()}
            >
              <ImagePlus size={14} />
              {folder.artwork ? 'Replace artwork' : 'Upload artwork'}
            </Button>
            <input
              ref={artworkInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleArtworkChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

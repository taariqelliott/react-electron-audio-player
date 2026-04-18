import { CreateFolderFormProps } from '@shared/types'
import { ChangeEvent, JSX } from 'react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'

export function CreateFolderForm({
  folderName,
  folderType,
  folderArtist,
  onFolderNameChange,
  onFolderTypeChange,
  onFolderArtistChange,
  onFolderArtworkChange,
  onCreateFolder
}: CreateFolderFormProps): JSX.Element {
  return (
    <div className="flex items-center justify-center flex-col gap-2">
      <Dialog>
        <DialogTrigger render={<Button variant="outline">Add New Folder</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter details for your album</DialogTitle>
            <Label htmlFor="folderType">Folder Type</Label>
            <Input
              type="text"
              id="folderType"
              value={folderType}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onFolderTypeChange(e.target.value)}
            />
            <Label htmlFor="folderName">Folder Name</Label>
            <Input
              type="text"
              id="folderName"
              value={folderName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onFolderNameChange(e.target.value)}
            />
            <Label htmlFor="folderArtist">Folder Artist</Label>
            <Input
              type="text"
              id="folderArtist"
              value={folderArtist}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onFolderArtistChange(e.target.value)}
            />
            <Label htmlFor="folderArtwork">Folder Artwork</Label>
            <Input
              type="file"
              id="folderArtwork"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                if (!e.target.files) return
                onFolderArtworkChange(e.target.files[0])
              }}
            />
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <DialogClose render={<Button onClick={onCreateFolder}>Create Folder</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

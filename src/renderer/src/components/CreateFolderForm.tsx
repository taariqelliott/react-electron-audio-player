import { CreateFolderFormProps } from '@shared/types'
import { ChangeEvent, JSX } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

export function CreateFolderForm({
  folderName,
  folderType,
  folderArtist,
  onFolderNameChange,
  onFolderTypeChange,
  onFolderArtistChange,
  onCreateFolder
}: CreateFolderFormProps): JSX.Element {
  return (
    <div className="flex items-center justify-center flex-col gap-2">
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
      <Button onClick={onCreateFolder}>Create Folder</Button>
    </div>
  )
}

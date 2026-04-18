import { CreateFolderFormProps } from '@shared/types'
import { InfoIcon } from 'lucide-react'
import { ChangeEvent, JSX, useRef, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
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
import { useTheme } from './use-theme'

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
  const [showAlert, setShowAlert] = useState(false)
  const [hasArtwork, setHasArtwork] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerAlert = (): void => {
    setShowAlert(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setShowAlert(false), 3000)
  }

  const handleCreate = (): void => {
    if (!folderName || !folderType || !folderArtist || !hasArtwork) {
      triggerAlert()
      return
    }
    onCreateFolder()
  }

  const { theme } = useTheme()
  console.log(theme)

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
                setHasArtwork(true)
              }}
            />
            {showAlert && (
              <Alert>
                <InfoIcon
                  color={
                    theme === 'light' ? 'oklch(63.7% 0.237 25.331)' : 'oklch(70.4% 0.191 22.216)'
                  }
                />
                <AlertTitle className="dark:text-red-400 text-red-500">Missing fields</AlertTitle>
                <AlertDescription>
                  Please fill in all fields and upload artwork before creating.
                </AlertDescription>
              </Alert>
            )}
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button onClick={handleCreate}>Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { CreateFolderFormProps } from '@shared/types'
import { FolderPlus, InfoIcon } from 'lucide-react'
import { ChangeEvent, JSX, useRef, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { Button } from './ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
  const [open, setOpen] = useState(false)
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
    setOpen(false)
    setHasArtwork(false)
  }

  const { theme } = useTheme()

  return (
    <div className="flex items-center justify-center flex-col gap-2 absolute top-2 right-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button variant="outline">
              <FolderPlus />
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="mb-4">Add a new release</DialogTitle>
            <Label htmlFor="folderType">Release Type</Label>
            <DialogDescription className="-my-1">
              e.g. Album, EP, Single, Mixtape, Compilation
            </DialogDescription>
            <Input
              type="text"
              id="folderType"
              value={folderType}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onFolderTypeChange(e.target.value)}
            />
            <Label htmlFor="folderName">Release Title</Label>
            <Input
              type="text"
              id="folderName"
              value={folderName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onFolderNameChange(e.target.value)}
            />
            <Label htmlFor="folderArtist">Artist</Label>
            <Input
              type="text"
              id="folderArtist"
              value={folderArtist}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onFolderArtistChange(e.target.value)}
            />
            <Label htmlFor="folderArtwork" className="cursor-pointer">
              Artwork
            </Label>
            <Input
              className="cursor-pointer"
              type="file"
              accept="image/*"
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
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

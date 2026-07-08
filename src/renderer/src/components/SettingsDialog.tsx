import { initialsFor } from '@/lib/utils'
import { useAlbumStore } from '@shared/store'
import { AppConfig } from '@shared/types'
import { DatabaseZap, FolderCog, ImagePlus } from 'lucide-react'
import { ChangeEvent, JSX, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Separator } from './ui/separator'

type SettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  libraryRoot: string | null
  onLibraryRootChanged: (libraryRoot: string) => void
  username: string
  avatarUrl: string | null
  onProfileUpdated: (config: AppConfig) => void
}

function ProfileSection({
  username,
  avatarUrl,
  onProfileUpdated
}: Pick<SettingsDialogProps, 'username' | 'avatarUrl' | 'onProfileUpdated'>): JSX.Element {
  const [draftName, setDraftName] = useState(username)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const isDirty = draftName.trim() !== username

  // Uploads immediately on selection — no separate save step for the picture
  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setAvatarError(null)

    // Reject formats Chromium can't render (e.g. HEIC) before persisting
    const objectUrl = URL.createObjectURL(file)
    try {
      const probe = new Image()
      probe.src = objectUrl
      await probe.decode()
    } catch {
      setAvatarError('That image format isn’t supported — use a JPG, PNG, or WebP.')
      URL.revokeObjectURL(objectUrl)
      return
    }
    URL.revokeObjectURL(objectUrl)

    setIsUploading(true)
    try {
      const config = await window.musicPlayer.updateProfile({
        username,
        avatarSourcePath: window.musicPlayer.getFilePath(file)
      })
      onProfileUpdated(config)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async (): Promise<void> => {
    if (!draftName.trim()) return
    setIsSaving(true)
    try {
      const config = await window.musicPlayer.updateProfile({ username: draftName.trim() })
      onProfileUpdated(config)
    } finally {
      setIsSaving(false)
    }
  }

  const previewSrc = avatarUrl

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">Profile</p>
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          {previewSrc && <AvatarImage src={previewSrc} className="object-cover" />}
          <AvatarFallback className="text-base font-semibold">
            {initialsFor(draftName || username)}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="outline"
          disabled={isUploading}
          onClick={() => avatarInputRef.current?.click()}
        >
          <ImagePlus size={14} />
          {isUploading ? 'Uploading…' : previewSrc ? 'Change picture' : 'Upload picture'}
        </Button>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>
      {avatarError && <p className="text-xs text-destructive">{avatarError}</p>}
      <div className="flex flex-col gap-2">
        <Label htmlFor="settingsUsername">Username</Label>
        <div className="flex gap-2">
          <Input
            id="settingsUsername"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Your name"
          />
          <Button onClick={handleSave} disabled={isSaving || !isDirty || !draftName.trim()}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function SettingsDialog({
  open,
  onOpenChange,
  libraryRoot,
  onLibraryRootChanged,
  username,
  avatarUrl,
  onProfileUpdated
}: SettingsDialogProps): JSX.Element {
  const setFolders = useAlbumStore((state) => state.setFolders)
  const updateActiveFolder = useAlbumStore((state) => state.updateActiveFolder)
  const setActiveTrackFilename = useAlbumStore((state) => state.setActiveTrackFilename)
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [rebuildResult, setRebuildResult] = useState<string | null>(null)

  const handleChangeLibrary = async (): Promise<void> => {
    const result = await window.musicPlayer.changeLibraryRoot()
    if (!result) return
    updateActiveFolder(null)
    setActiveTrackFilename(null)
    setFolders(result.folders)
    onLibraryRootChanged(result.libraryRoot)
    onOpenChange(false)
  }

  const handleRebuildIndex = async (): Promise<void> => {
    setIsRebuilding(true)
    setRebuildResult(null)
    try {
      const result = await window.musicPlayer.rebuildIndex()
      const folders = await window.musicPlayer.getFolders()
      setFolders(folders)
      setRebuildResult(`Indexed ${result.folders} folders and ${result.tracks} tracks.`)
    } finally {
      setIsRebuilding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your profile, library location, and search index.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <ProfileSection
            key={`profile-${open}-${username}-${avatarUrl}`}
            username={username}
            avatarUrl={avatarUrl}
            onProfileUpdated={onProfileUpdated}
          />

          <Separator />

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Library location</p>
            <p className="text-xs text-muted-foreground break-all">{libraryRoot ?? 'Not set'}</p>
            <Button variant="outline" className="justify-start" onClick={handleChangeLibrary}>
              <FolderCog size={14} />
              Change library location
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Search index</p>
            <p className="text-xs text-muted-foreground">
              Rescans every folder in your library and rebuilds the search database from scratch.
            </p>
            <Button
              variant="outline"
              className="justify-start"
              onClick={handleRebuildIndex}
              disabled={isRebuilding}
            >
              <DatabaseZap size={14} />
              {isRebuilding ? 'Rebuilding…' : 'Rebuild index'}
            </Button>
            {rebuildResult && <p className="text-xs text-muted-foreground">{rebuildResult}</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@/components/ui/sidebar'
import { useAlbumStore } from '@shared/store'
import { Manifest } from '@shared/types'
import {
  AudioLines,
  ChevronRightIcon,
  Disc3,
  DiscIcon,
  Moon,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Settings,
  Sun,
  Trash2
} from 'lucide-react'
import { AppConfig } from '@shared/types'
import { JSX, useState } from 'react'
import { initialsFor, localFileUrl } from '@/lib/utils'
import { FolderEditDialog } from './FolderEditDialog'
import { SearchCommand } from './SearchCommand'
import { SettingsDialog } from './SettingsDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from './ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu'
import { Skeleton } from './ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { useTheme } from './use-theme'

function ThemeToggle(): JSX.Element {
  const { theme, setTheme } = useTheme()
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto size-7 shrink-0"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          />
        }
      >
        <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        <span className="sr-only">Toggle theme</span>
      </TooltipTrigger>
      <TooltipContent>Toggle theme</TooltipContent>
    </Tooltip>
  )
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  albums: Manifest[]
  isLoading?: boolean
  libraryRoot: string | null
  onLibraryRootChanged: (libraryRoot: string) => void
  username: string
  avatarUrl: string | null
  onProfileUpdated: (config: AppConfig) => void
  onFolderDeleted: (folderPath: string) => void
}

export function AppSidebar({
  albums,
  isLoading = false,
  libraryRoot,
  onLibraryRootChanged,
  username,
  avatarUrl,
  onProfileUpdated,
  onFolderDeleted,
  ...props
}: AppSidebarProps): JSX.Element {
  const activeFolder = useAlbumStore((state) => state.activeFolder)
  const updateActiveFolder = useAlbumStore((state) => state.updateActiveFolder)
  const removeFolder = useAlbumStore((state) => state.removeFolder)
  const applyManifest = useAlbumStore((state) => state.applyManifest)
  const [folderToEdit, setFolderToEdit] = useState<Manifest | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [folderToDelete, setFolderToDelete] = useState<Manifest | null>(null)

  // Linked folders live outside the library root — deleting only unlinks them
  const isLinked = (folder: Manifest): boolean =>
    !libraryRoot || !folder.folderPath.startsWith(`${libraryRoot}/`)

  const handleDeleteFolder = async (): Promise<void> => {
    if (!folderToDelete) return
    const folderPath = folderToDelete.folderPath
    await window.musicPlayer.deleteFolder(folderPath)
    setFolderToDelete(null)
    onFolderDeleted(folderPath)
    removeFolder(folderPath)
  }

  return (
    <Sidebar variant="sidebar" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                <AudioLines className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Audio Player v2</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SearchCommand />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarMenu>
            <Collapsible defaultOpen render={<SidebarMenuItem />}>
              <SidebarMenuButton>
                <Disc3 />
                <span>Albums</span>
              </SidebarMenuButton>
              <CollapsibleTrigger
                render={<SidebarMenuAction className="aria-expanded:rotate-90" />}
              >
                <ChevronRightIcon />
                <span className="sr-only">Toggle Albums</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {isLoading ? (
                    Array.from({ length: 4 }, (_, index) => (
                      <SidebarMenuSubItem key={index}>
                        <div className="flex items-center gap-2 px-2 py-1.5">
                          <Skeleton className="size-6 rounded-full" />
                          <Skeleton className="h-4 flex-1" />
                        </div>
                      </SidebarMenuSubItem>
                    ))
                  ) : albums.length === 0 ? (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton className="text-muted-foreground italic">
                        No albums yet
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ) : (
                    albums.map((album) => (
                      <SidebarMenuSubItem key={album.folderPath} className="group/album relative">
                        <SidebarMenuSubButton
                          onClick={() => updateActiveFolder(album)}
                          className="cursor-pointer flex items-center justify-between flex-row pr-7"
                        >
                          <div className="flex items-center justify-center gap-2 min-w-0">
                            <Avatar size="sm">
                              {album.artwork && (
                                <AvatarImage src={localFileUrl(album.folderPath, album.artwork)} />
                              )}
                            </Avatar>
                            <p className="truncate">{album.name}</p>
                          </div>
                          {activeFolder?.folderPath === album.folderPath && (
                            <DiscIcon className="shrink-0" />
                          )}
                        </SidebarMenuSubButton>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-1/2 -translate-y-1/2 size-6 opacity-0 group-hover/album:opacity-100 data-popup-open:opacity-100"
                                aria-label="Folder options"
                              />
                            }
                          >
                            <MoreHorizontal className="size-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" align="start">
                            <DropdownMenuItem
                              onClick={() => {
                                setFolderToEdit(album)
                                setIsEditOpen(true)
                              }}
                            >
                              <Pencil className="size-3.5" />
                              Edit folder
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async () => {
                                const updated = await window.musicPlayer.rescanFolder(
                                  album.folderPath
                                )
                                applyManifest(updated)
                              }}
                            >
                              <RefreshCw className="size-3.5" />
                              Rescan folder
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setFolderToDelete(album)}
                            >
                              <Trash2 className="size-3.5" />
                              {isLinked(album) ? 'Remove from library' : 'Delete folder'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuSubItem>
                    ))
                  )}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(true)}
                      className="flex items-center gap-2 min-w-0 rounded-md hover:bg-accent/60 transition-colors cursor-pointer -mx-1 px-1 py-0.5"
                    />
                  }
                >
                  <Avatar className="size-8 shrink-0">
                    {avatarUrl && <AvatarImage src={avatarUrl} className="object-cover" />}
                    <AvatarFallback className="bg-primary text-white text-xs font-bold">
                      {initialsFor(username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm font-medium">{username}</span>
                </TooltipTrigger>
                <TooltipContent>Edit profile</TooltipContent>
              </Tooltip>
              <ThemeToggle />
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      onClick={() => setIsSettingsOpen(true)}
                    />
                  }
                >
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <FolderEditDialog folder={folderToEdit} open={isEditOpen} onOpenChange={setIsEditOpen} />
      <AlertDialog
        open={folderToDelete !== null}
        onOpenChange={(open) => !open && setFolderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {folderToDelete && isLinked(folderToDelete)
                ? `Remove “${folderToDelete?.name}” from your library?`
                : `Delete “${folderToDelete?.name}”?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {folderToDelete && isLinked(folderToDelete)
                ? 'This only removes the link — the folder and its files stay untouched on your disk. You can import it again anytime.'
                : 'This permanently deletes the folder and every file inside it from disk. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteFolder}>
              {folderToDelete && isLinked(folderToDelete) ? 'Remove' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        libraryRoot={libraryRoot}
        onLibraryRootChanged={onLibraryRootChanged}
        username={username}
        avatarUrl={avatarUrl}
        onProfileUpdated={onProfileUpdated}
      />
    </Sidebar>
  )
}

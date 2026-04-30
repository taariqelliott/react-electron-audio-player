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
import { AudioLines, ChevronRightIcon, Disc3, DiscIcon, Moon, Sun } from 'lucide-react'
import { JSX } from 'react'
import { Avatar, AvatarImage } from './ui/avatar'
import { useTheme } from './use-theme'

function ThemeToggle(): JSX.Element {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      className="ml-auto size-7 shrink-0"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  albums: Manifest[]
}

export function AppSidebar({ albums, ...props }: AppSidebarProps): JSX.Element {
  const activeFolder = useAlbumStore((state) => state.activeFolder)
  const updateActiveFolder = useAlbumStore((state) => state.updateActiveFolder)
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
                  {albums.length === 0 ? (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton className="text-muted-foreground italic">
                        No albums yet
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ) : (
                    albums.map((album) => (
                      <SidebarMenuSubItem
                        key={album.folderPath}
                        onClick={() => updateActiveFolder(album)}
                      >
                        <SidebarMenuSubButton className="cursor-pointer flex items-center justify-between flex-row">
                          <div className="flex items-center justify-center gap-2">
                            <Avatar size="sm">
                              <AvatarImage src={`localfile://${album.folderPath}/artwork.jpg`} />
                            </Avatar>
                            <p>{album.name}</p>
                          </div>
                          {activeFolder?.folderPath === album.folderPath && <DiscIcon />}
                        </SidebarMenuSubButton>
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
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                TK
              </div>
              <span className="truncate text-sm font-medium">taariqkwame</span>
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

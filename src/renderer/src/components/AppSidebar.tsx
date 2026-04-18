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
import { Manifest } from '@shared/types'
import { ChevronRightIcon, DiscIcon, Moon, MusicIcon, Sun } from 'lucide-react'
import { JSX } from 'react'
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
  return (
    <Sidebar variant="sidebar" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                <MusicIcon className="size-4" />
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
                <DiscIcon />
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
                      <SidebarMenuSubItem key={album.folderPath}>
                        <SidebarMenuSubButton>
                          <p className="cursor-pointer">{album.name}</p>
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
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
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

import { useAlbumStore } from '@shared/store'
import { SearchResult } from '@shared/types'
import { Disc3, Music2, Search } from 'lucide-react'
import { JSX, useEffect, useState } from 'react'
import { Button } from './ui/button'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from './ui/command'

export function SearchCommand(): JSX.Element {
  const folders = useAlbumStore((state) => state.folders)
  const updateActiveFolder = useAlbumStore((state) => state.updateActiveFolder)
  const setActiveTrackFilename = useAlbumStore((state) => state.setActiveTrackFilename)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (
        (event.metaKey || event.ctrlKey) &&
        (event.code === 'KeyK' || event.key.toLowerCase() === 'k')
      ) {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!query.trim()) return undefined
    const timeoutId = setTimeout(async () => {
      const searchResults = await window.musicPlayer.searchLibrary(query)
      setResults(searchResults)
    }, 200)
    return (): void => clearTimeout(timeoutId)
  }, [query])

  const handleQueryChange = (value: string): void => {
    setQuery(value)
    if (!value.trim()) setResults([])
  }

  const handleSelect = (result: SearchResult): void => {
    const folder = folders.find((entry) => entry.folderPath === result.folderPath)
    if (folder) {
      updateActiveFolder(folder)
      setActiveTrackFilename(result.kind === 'track' ? result.filename : null)
    }
    setOpen(false)
    setQuery('')
  }

  const folderResults = results.filter((result) => result.kind === 'folder')
  const trackResults = results.filter((result) => result.kind === 'track')

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start text-muted-foreground font-normal"
        onClick={() => setOpen(true)}
      >
        <Search size={14} />
        Search library…
        <kbd className="ml-auto text-[10px] tracking-wider text-muted-foreground/70">
          {navigator.platform.toLowerCase().includes('mac') ? '⌘K' : 'Ctrl K'}
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) setQuery('')
        }}
        title="Search library"
        description="Search folders and tracks"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search folders and tracks…"
            value={query}
            onValueChange={handleQueryChange}
          />
          <CommandList>
            <CommandEmpty>
              {query.trim() ? 'No results found.' : 'Type to search your library.'}
            </CommandEmpty>
            {folderResults.length > 0 && (
              <CommandGroup heading="Folders">
                {folderResults.map((result) => (
                  <CommandItem
                    key={`folder-${result.folderPath}`}
                    value={`folder-${result.folderPath}`}
                    onSelect={() => handleSelect(result)}
                  >
                    <Disc3 size={14} />
                    <span className="truncate">{result.title}</span>
                    {result.artist && (
                      <span className="text-muted-foreground truncate">{result.artist}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {trackResults.length > 0 && (
              <CommandGroup heading="Tracks">
                {trackResults.map((result) => (
                  <CommandItem
                    key={`track-${result.folderPath}-${result.filename}`}
                    value={`track-${result.folderPath}-${result.filename}`}
                    onSelect={() => handleSelect(result)}
                  >
                    <Music2 size={14} />
                    <span className="truncate">{result.title}</span>
                    <span className="text-muted-foreground truncate">
                      {result.artist || result.folderName}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}

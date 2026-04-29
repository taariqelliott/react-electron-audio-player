import { Pause, Play, Square } from 'lucide-react'
import { JSX } from 'react'
import ActiveFolder from './components/ActiveFolder'
import { AppSidebar } from './components/AppSidebar'
import { CreateFolderForm } from './components/CreateFolderForm'
import { FolderList } from './components/FolderList'
import { LoadingScreen } from './components/LoadingScreen'
import { SetupScreen } from './components/SetupScreen'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { SidebarInset, SidebarProvider, SidebarTrigger } from './components/ui/sidebar'
import { useAudioEngine } from './hooks/useAudioEngine'
import { useLibrary } from './hooks/useLibrary'

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function App(): JSX.Element {
  const {
    isPlaying,
    currentPlaybackTime,
    totalTrackDuration,
    currentTrackName,
    handleFileUpload,
    play,
    pause,
    stop
  } = useAudioEngine()

  const {
    appConfig,
    libraryRootExists,
    isLoadingConfig,
    folders,
    folderName,
    folderType,
    folderArtist,
    setFolderName,
    setFolderType,
    setFolderArtist,
    setFolderArtwork,
    selectLibraryRoot,
    createFolder
  } = useLibrary()

  if (isLoadingConfig) return <LoadingScreen />

  if (appConfig?.libraryRoot === null || !libraryRootExists) {
    return (
      <SetupScreen
        libraryRootIsNull={appConfig?.libraryRoot === null}
        onSelectLibraryRoot={selectLibraryRoot}
      />
    )
  }

  const progress = totalTrackDuration > 0 ? (currentPlaybackTime / totalTrackDuration) * 100 : 0

  return (
    <SidebarProvider>
      <AppSidebar albums={folders} />
      <SidebarInset className="flex flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-2" />
        </header>
        <div className="flex-1 overflow-y-auto flex flex-col items-center gap-4 p-4 pb-0">
          <CreateFolderForm
            folderName={folderName}
            folderType={folderType}
            folderArtist={folderArtist}
            onFolderArtworkChange={setFolderArtwork}
            onFolderNameChange={setFolderName}
            onFolderTypeChange={setFolderType}
            onFolderArtistChange={setFolderArtist}
            onCreateFolder={createFolder}
          />
          <ActiveFolder folders={folders} />
          <FolderList folders={folders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))} />
        </div>
        <div className="shrink-0 border-t border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="w-full h-[3px] bg-muted">
            <div className="h-full bg-primary transition-none" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center px-6 py-3 gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight">
                {currentTrackName ?? '—'}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                {formatTime(currentPlaybackTime)}
                <span className="text-muted-foreground/50 mx-1">/</span>
                {formatTime(totalTrackDuration)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={stop}>
                <Square size={14} />
              </Button>
              <Button
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={isPlaying ? pause : play}
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              </Button>
            </div>
            <div className="flex-1 flex justify-end">
              <Input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="max-w-48 text-xs cursor-pointer hover:opacity-80 transition-opacity duration-150"
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

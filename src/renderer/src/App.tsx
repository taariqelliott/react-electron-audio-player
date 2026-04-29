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

export default function App(): JSX.Element {
  const {
    isPlaying,
    currentPlaybackTime,
    totalTrackDuration,
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

  return (
    <SidebarProvider>
      <AppSidebar albums={folders} />
      <SidebarInset className="">
        <header className="flex h-12 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-2" />
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
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
          <p className="flex gap-1">
            Current time: <span className="tabular-nums">{currentPlaybackTime.toFixed(2)}s</span>
          </p>
          <section className="flex gap-2">
            <Button className="w-18" onClick={isPlaying ? pause : play} variant="default">
              {isPlaying ? <Pause /> : <Play />}
            </Button>
            <Button className="w-18" onClick={stop} variant="default">
              <Square />
            </Button>
          </section>
          <Input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="my-2 max-w-3/4 hover:opacity-85 transition-opacity duration-200 cursor-pointer"
          />
          <div className="w-3/4 relative bg-primary h-6 rounded overflow-hidden">
            <div
              className="absolute bg-foreground h-6"
              style={{ width: `${(currentPlaybackTime / totalTrackDuration) * 100}%` }}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

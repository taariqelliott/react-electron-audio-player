import { Pause, Play, Square } from 'lucide-react'
import { JSX } from 'react'
import { CreateFolderForm } from './components/CreateFolderForm'
import { FolderList } from './components/FolderList'
import { LoadingScreen } from './components/LoadingScreen'
import { SetupScreen } from './components/SetupScreen'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
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
    <div className="h-screen w-full justify-center items-center flex flex-col transition-all duration-100 gap-4 bg-primary-foreground">
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
      <div className="w-3/4 relative bg-pink-500 h-6 rounded overflow-hidden">
        <div
          className="absolute bg-amber-200 h-6"
          style={{ width: `${(currentPlaybackTime / totalTrackDuration) * 100}%` }}
        />
      </div>
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
      <FolderList folders={folders} />
    </div>
  )
}

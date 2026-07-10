import { localFileUrl } from '@/lib/utils'
import { useAlbumStore } from '@shared/store'
import { TrackEntry } from '@shared/types'
import { Pause, Play, SkipBack, SkipForward, Square, Volume1, Volume2, VolumeX } from 'lucide-react'
import { JSX, useRef, useState } from 'react'
import ActiveFolder from './components/ActiveFolder'
import { AppSidebar } from './components/AppSidebar'
import { CreateFolderForm } from './components/CreateFolderForm'
import { FolderList } from './components/FolderList'
import { LoadingScreen } from './components/LoadingScreen'
import { SetupScreen } from './components/SetupScreen'
import { Button } from './components/ui/button'
import { SidebarInset, SidebarProvider, SidebarTrigger } from './components/ui/sidebar'
import { Skeleton } from './components/ui/skeleton'
import { Slider } from './components/ui/slider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip'
import { useAudioEngine } from './hooks/useAudioEngine'
import { useLibrary } from './hooks/useLibrary'

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const toNumber = (value: number | readonly number[]): number =>
  Array.isArray(value) ? value[0] : (value as number)

type SeekSliderProps = {
  currentTime: number
  duration: number
  onSeek: (seconds: number) => void
}

function SeekSlider({ currentTime, duration, onSeek }: SeekSliderProps): JSX.Element {
  const [scrubValue, setScrubValue] = useState<number | null>(null)

  return (
    <Slider
      value={scrubValue ?? Math.min(currentTime, duration)}
      min={0}
      max={duration > 0 ? duration : 1}
      step={0.1}
      disabled={duration === 0}
      onValueChange={(value) => setScrubValue(toNumber(value))}
      onValueCommitted={(value) => {
        onSeek(toNumber(value))
        setScrubValue(null)
      }}
      aria-label="Seek"
    />
  )
}

export default function App(): JSX.Element {
  const {
    isPlaying,
    currentPlaybackTime,
    totalTrackDuration,
    currentTrackName,
    volume,
    loadTrack,
    play,
    pause,
    stop,
    seek,
    setVolume,
    getAnalyser
  } = useAudioEngine()

  const {
    appConfig,
    libraryRootExists,
    isLoadingConfig,
    isLoadingFolders,
    folders,
    folderName,
    folderType,
    folderArtist,
    setFolderName,
    setFolderType,
    setFolderArtist,
    setFolderArtwork,
    selectLibraryRoot,
    createFolder,
    applyLibraryRoot,
    applyConfig
  } = useLibrary()

  const activeFolder = useAlbumStore((state) => state.activeFolder)
  const activeTrackFilename = useAlbumStore((state) => state.activeTrackFilename)
  const setActiveTrackFilename = useAlbumStore((state) => state.setActiveTrackFilename)
  const [avatarVersion, setAvatarVersion] = useState(0)
  const lastVolumeRef = useRef(1)

  const toggleMute = (): void => {
    if (volume > 0) {
      lastVolumeRef.current = volume
      setVolume(0)
    } else {
      setVolume(lastVolumeRef.current || 1)
    }
  }

  if (isLoadingConfig) return <LoadingScreen />

  if (appConfig?.libraryRoot === null || !libraryRootExists) {
    return (
      <SetupScreen
        libraryRootIsNull={appConfig?.libraryRoot === null}
        onSelectLibraryRoot={selectLibraryRoot}
      />
    )
  }

  const handlePlayTrack = (track: TrackEntry): void => {
    if (!activeFolder) return
    setActiveTrackFilename(track.filename)
    const url = localFileUrl(activeFolder.folderPath, track.filename)
    loadTrack(url, track.title || track.filename)
  }

  const playableTracks = activeFolder
    ? [...activeFolder.tracks].sort((a, b) => a.trackOrder - b.trackOrder).filter((t) => !t.missing)
    : []
  const currentTrackIndex = playableTracks.findIndex(
    (track) => track.filename === activeTrackFilename
  )

  const playNext = (): void => {
    if (playableTracks.length === 0) return
    handlePlayTrack(playableTracks[(currentTrackIndex + 1) % playableTracks.length])
  }

  const playPrevious = (): void => {
    if (playableTracks.length === 0) return
    // Restart the current track when past 3s, otherwise jump to the previous one
    if (currentPlaybackTime > 3 && currentTrackIndex !== -1) {
      seek(0)
      return
    }
    handlePlayTrack(
      playableTracks[(currentTrackIndex - 1 + playableTracks.length) % playableTracks.length]
    )
  }

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <TooltipProvider delay={300}>
      <SidebarProvider>
        <AppSidebar
          albums={folders}
          isLoading={isLoadingFolders}
          libraryRoot={appConfig?.libraryRoot ?? null}
          onLibraryRootChanged={applyLibraryRoot}
          username={appConfig?.username || 'Set your name'}
          avatarUrl={
            appConfig?.avatarPath ? `${localFileUrl(appConfig.avatarPath)}?v=${avatarVersion}` : null
          }
          onProfileUpdated={(config) => {
            applyConfig(config)
            setAvatarVersion((version) => version + 1)
          }}
        />
        <SidebarInset className="flex flex-col overflow-hidden">
          <header className="flex h-12 shrink-0 items-center gap-2 px-4">
            <Tooltip>
              <TooltipTrigger render={<SidebarTrigger className="-ml-2" />} />
              <TooltipContent>Toggle sidebar</TooltipContent>
            </Tooltip>
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
            <ActiveFolder
              onPlayTrack={handlePlayTrack}
              getAnalyser={getAnalyser}
              isPlaying={isPlaying}
            />
            {isLoadingFolders ? (
              <div className="flex flex-wrap gap-4 p-4 justify-center">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="w-48 h-48 rounded-xl" />
                ))}
              </div>
            ) : (
              <FolderList
                folders={[...folders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))}
              />
            )}
          </div>
          <div className="shrink-0 border-t border-border/40 bg-background/60 backdrop-blur-xl">
            <div className="flex items-center px-6 py-3 gap-6">
              <div className="w-56 min-w-0 shrink-0">
                <p className="text-sm font-medium truncate leading-tight">
                  {currentTrackName ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                  {formatTime(currentPlaybackTime)}
                  <span className="text-muted-foreground/50 mx-1">/</span>
                  {formatTime(totalTrackDuration)}
                </p>
              </div>

              <div className="flex-1 flex items-center gap-4">
                <div className="flex items-center gap-1 shrink-0">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={stop} />
                      }
                    >
                      <Square size={14} />
                    </TooltipTrigger>
                    <TooltipContent>Stop</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={playableTracks.length === 0}
                          onClick={playPrevious}
                        />
                      }
                    >
                      <SkipBack size={14} />
                    </TooltipTrigger>
                    <TooltipContent>Previous track</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          size="icon"
                          className="h-9 w-9 rounded-full"
                          onClick={isPlaying ? pause : play}
                        />
                      }
                    >
                      {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                    </TooltipTrigger>
                    <TooltipContent>{isPlaying ? 'Pause' : 'Play'}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={playableTracks.length === 0}
                          onClick={playNext}
                        />
                      }
                    >
                      <SkipForward size={14} />
                    </TooltipTrigger>
                    <TooltipContent>Next track</TooltipContent>
                  </Tooltip>
                </div>
                <SeekSlider
                  currentTime={currentPlaybackTime}
                  duration={totalTrackDuration}
                  onSeek={seek}
                />
              </div>

              <div className="flex items-center gap-2 w-40 shrink-0">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground"
                        onClick={toggleMute}
                      />
                    }
                  >
                    <VolumeIcon size={16} />
                  </TooltipTrigger>
                  <TooltipContent>{volume === 0 ? 'Unmute' : 'Mute'}</TooltipContent>
                </Tooltip>
                <Slider
                  value={volume}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(value) => setVolume(toNumber(value))}
                  aria-label="Volume"
                />
              </div>

              {/* <div className="w-44 shrink-0">
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="text-xs cursor-pointer hover:opacity-80 transition-opacity duration-150"
                />
              </div> */}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

import { Pause, Play, Square } from 'lucide-react'
import { ChangeEvent, JSX, useEffect, useRef, useState } from 'react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { AppConfig } from './interface'

export default function App(): JSX.Element {
  const audioContextRef = useRef<AudioContext | null>(null)
  const activeSourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const decodedAudioBufferRef = useRef<AudioBuffer | null>(null)
  const playbackStartedAtRef = useRef<number>(0)
  const playbackPausedAtRef = useRef<number>(0)
  const animationFrameIdRef = useRef<number | null>(null)
  const wasStoppedManuallyRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0)
  const [totalTrackDuration, setTotalTrackDuration] = useState(0)
  const [appConfig, setAppConfig] = useState<AppConfig>()

  useEffect(() => {
    const loadAppConfig = async (): Promise<void> => {
      const config = await window.musicPlayer.readConfigFile()
      setAppConfig(config)
    }
    loadAppConfig()
  }, [])

  const selectLibraryRoot = async (): Promise<void> => {
    const selectedPath = await window.musicPlayer.selectLibraryRoot()
    setAppConfig({ libraryRoot: selectedPath })
  }

  const getOrCreateAudioContext = (): AudioContext => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext()
    }
    return audioContextRef.current
  }

  const updatePlaybackPosition = (): void => {
    setCurrentPlaybackTime(getOrCreateAudioContext().currentTime - playbackStartedAtRef.current)
    animationFrameIdRef.current = requestAnimationFrame(updatePlaybackPosition)
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (!event.target.files) return

    wasStoppedManuallyRef.current = true
    activeSourceNodeRef.current?.stop()
    activeSourceNodeRef.current = null

    if (audioContextRef.current) {
      await audioContextRef.current.close()
    }

    audioContextRef.current = new AudioContext()

    playbackPausedAtRef.current = 0
    playbackStartedAtRef.current = 0
    setIsPlaying(false)
    setCurrentPlaybackTime(0)
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current)

    const file = event.target.files[0]
    const rawAudioBytes = await file.arrayBuffer()
    decodedAudioBufferRef.current = await audioContextRef.current.decodeAudioData(rawAudioBytes)
    setTotalTrackDuration(decodedAudioBufferRef.current.duration)
  }

  const play = async (): Promise<void> => {
    if (!decodedAudioBufferRef.current) return
    const audioContext = getOrCreateAudioContext()

    wasStoppedManuallyRef.current = true
    activeSourceNodeRef.current?.stop()
    activeSourceNodeRef.current = null

    const newSourceNode = audioContext.createBufferSource()
    newSourceNode.buffer = decodedAudioBufferRef.current
    newSourceNode.connect(audioContext.destination)
    newSourceNode.start(0, playbackPausedAtRef.current)
    playbackStartedAtRef.current = audioContext.currentTime - playbackPausedAtRef.current
    wasStoppedManuallyRef.current = false

    newSourceNode.onended = () => {
      if (wasStoppedManuallyRef.current) {
        wasStoppedManuallyRef.current = false
        return
      }
      activeSourceNodeRef.current = null
      playbackPausedAtRef.current = 0
      playbackStartedAtRef.current = 0
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current)
      setCurrentPlaybackTime(0)
      setIsPlaying(false)
    }

    activeSourceNodeRef.current = newSourceNode
    setIsPlaying(true)
    animationFrameIdRef.current = requestAnimationFrame(updatePlaybackPosition)
  }

  const pause = (): void => {
    wasStoppedManuallyRef.current = true
    activeSourceNodeRef.current?.stop()
    playbackPausedAtRef.current =
      getOrCreateAudioContext().currentTime - playbackStartedAtRef.current
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current)
    setIsPlaying(false)
  }

  const stop = (): void => {
    wasStoppedManuallyRef.current = true
    activeSourceNodeRef.current?.stop()
    activeSourceNodeRef.current = null
    playbackPausedAtRef.current = 0
    playbackStartedAtRef.current = 0
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current)
    setCurrentPlaybackTime(0)
    setIsPlaying(false)
  }

  if (appConfig?.libraryRoot === null) {
    return (
      <div className="h-screen w-full justify-center items-center flex flex-col transition-all duration-100 gap-4 bg-primary-foreground">
        <div className="flex flex-col items-center justify-center">
          <p>No Library Root Selected</p>
          <Button variant="default" onClick={selectLibraryRoot}>
            Set Library Root
          </Button>
        </div>
      </div>
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
    </div>
  )
}

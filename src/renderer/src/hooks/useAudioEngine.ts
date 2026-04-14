import { ChangeEvent, useRef, useState } from 'react'

export function useAudioEngine(): {
  isPlaying: boolean
  currentPlaybackTime: number
  totalTrackDuration: number
  handleFileUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  play: () => Promise<void>
  pause: () => void
  stop: () => void
} {
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

    newSourceNode.onended = (): void => {
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

  return {
    isPlaying,
    currentPlaybackTime,
    totalTrackDuration,
    handleFileUpload,
    play,
    pause,
    stop
  }
}

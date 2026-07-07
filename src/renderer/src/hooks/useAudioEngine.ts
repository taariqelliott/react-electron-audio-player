import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'

export type AudioEngine = {
  isPlaying: boolean
  currentPlaybackTime: number
  totalTrackDuration: number
  currentTrackName: string | null
  volume: number
  handleFileUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  loadTrack: (url: string, name: string, autoplay?: boolean) => Promise<void>
  play: () => Promise<void>
  pause: () => void
  stop: () => void
  seek: (seconds: number) => void
  setVolume: (value: number) => void
  getAnalyser: () => AnalyserNode | null
}

export function useAudioEngine(): AudioEngine {
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const analyserNodeRef = useRef<AnalyserNode | null>(null)
  const activeSourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const decodedAudioBufferRef = useRef<AudioBuffer | null>(null)
  const playbackStartedAtRef = useRef<number>(0)
  const playbackPausedAtRef = useRef<number>(0)
  const animationFrameIdRef = useRef<number | null>(null)
  const volumeRef = useRef(1)
  const loadIdRef = useRef(0)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0)
  const [totalTrackDuration, setTotalTrackDuration] = useState(0)
  const [currentTrackName, setCurrentTrackName] = useState<string | null>(null)
  const [volume, setVolumeState] = useState(1)

  const getOrCreateAudioContext = (): AudioContext => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext()
      gainNodeRef.current = null
      analyserNodeRef.current = null
    }
    const audioContext = audioContextRef.current
    // Signal chain: source → gain → analyser → destination
    if (!gainNodeRef.current) {
      const gainNode = audioContext.createGain()
      gainNode.gain.value = volumeRef.current
      const analyserNode = audioContext.createAnalyser()
      analyserNode.fftSize = 2048
      gainNode.connect(analyserNode)
      analyserNode.connect(audioContext.destination)
      gainNodeRef.current = gainNode
      analyserNodeRef.current = analyserNode
    }
    return audioContext
  }

  const cancelPositionLoop = (): void => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current)
      animationFrameIdRef.current = null
    }
  }

  const updatePlaybackPosition = (): void => {
    setCurrentPlaybackTime(getOrCreateAudioContext().currentTime - playbackStartedAtRef.current)
    animationFrameIdRef.current = requestAnimationFrame(updatePlaybackPosition)
  }

  // Nulls the ref before stopping so the source's onended sees it was superseded
  const stopActiveSource = (): void => {
    const source = activeSourceNodeRef.current
    activeSourceNodeRef.current = null
    source?.stop()
  }

  const startPlayback = (offsetSeconds: number): void => {
    if (!decodedAudioBufferRef.current || !gainNodeRef.current) return
    const audioContext = getOrCreateAudioContext()

    const newSourceNode = audioContext.createBufferSource()
    newSourceNode.buffer = decodedAudioBufferRef.current
    newSourceNode.connect(gainNodeRef.current)
    newSourceNode.start(0, offsetSeconds)
    playbackStartedAtRef.current = audioContext.currentTime - offsetSeconds

    newSourceNode.onended = (): void => {
      // Only a natural end of the still-active source resets playback state
      if (activeSourceNodeRef.current !== newSourceNode) return
      activeSourceNodeRef.current = null
      playbackPausedAtRef.current = 0
      playbackStartedAtRef.current = 0
      cancelPositionLoop()
      setCurrentPlaybackTime(0)
      setIsPlaying(false)
    }

    activeSourceNodeRef.current = newSourceNode
    setIsPlaying(true)
    cancelPositionLoop()
    animationFrameIdRef.current = requestAnimationFrame(updatePlaybackPosition)
  }

  const loadDecodedBuffer = async (
    rawAudioBytes: ArrayBuffer,
    name: string,
    autoplay: boolean
  ): Promise<void> => {
    const loadId = ++loadIdRef.current
    const audioContext = getOrCreateAudioContext()

    stopActiveSource()
    cancelPositionLoop()
    playbackPausedAtRef.current = 0
    playbackStartedAtRef.current = 0
    setIsPlaying(false)
    setCurrentPlaybackTime(0)
    setCurrentTrackName(name)

    const decodedBuffer = await audioContext.decodeAudioData(rawAudioBytes)
    if (loadId !== loadIdRef.current) return

    decodedAudioBufferRef.current = decodedBuffer
    setTotalTrackDuration(decodedBuffer.duration)

    if (autoplay) {
      if (audioContext.state === 'suspended') await audioContext.resume()
      startPlayback(0)
    }
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (!event.target.files || event.target.files.length === 0) return
    const file = event.target.files[0]
    const rawAudioBytes = await file.arrayBuffer()
    await loadDecodedBuffer(rawAudioBytes, file.name.replace(/\.[^/.]+$/, ''), false)
  }

  const loadTrack = async (url: string, name: string, autoplay = true): Promise<void> => {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Failed to load track: ${response.status}`)
      const rawAudioBytes = await response.arrayBuffer()
      await loadDecodedBuffer(rawAudioBytes, name, autoplay)
    } catch (error) {
      console.error('Failed to load track:', error)
    }
  }

  const play = async (): Promise<void> => {
    if (!decodedAudioBufferRef.current) return
    const audioContext = getOrCreateAudioContext()
    if (audioContext.state === 'suspended') await audioContext.resume()

    stopActiveSource()
    startPlayback(playbackPausedAtRef.current)
  }

  const pause = (): void => {
    stopActiveSource()
    playbackPausedAtRef.current =
      getOrCreateAudioContext().currentTime - playbackStartedAtRef.current
    cancelPositionLoop()
    setIsPlaying(false)
  }

  const stop = (): void => {
    stopActiveSource()
    playbackPausedAtRef.current = 0
    playbackStartedAtRef.current = 0
    cancelPositionLoop()
    setCurrentPlaybackTime(0)
    setIsPlaying(false)
  }

  const seek = (seconds: number): void => {
    if (!decodedAudioBufferRef.current) return
    const clamped = Math.max(0, Math.min(seconds, decodedAudioBufferRef.current.duration))

    if (isPlaying) {
      stopActiveSource()
      startPlayback(clamped)
    } else {
      playbackPausedAtRef.current = clamped
      setCurrentPlaybackTime(clamped)
    }
  }

  const setVolume = (value: number): void => {
    const clamped = Math.max(0, Math.min(value, 1))
    volumeRef.current = clamped
    setVolumeState(clamped)
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = clamped
    }
  }

  const getAnalyser = useCallback((): AnalyserNode | null => analyserNodeRef.current, [])

  useEffect(() => {
    return (): void => {
      cancelPositionLoop()
      activeSourceNodeRef.current?.stop()
      audioContextRef.current?.close()
    }
  }, [])

  return {
    isPlaying,
    currentPlaybackTime,
    totalTrackDuration,
    currentTrackName,
    volume,
    handleFileUpload,
    loadTrack,
    play,
    pause,
    stop,
    seek,
    setVolume,
    getAnalyser
  }
}

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
  setOnTrackEnded: (callback: (() => void) | null) => void
}

export function useAudioEngine(): AudioEngine {
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const analyserNodeRef = useRef<AnalyserNode | null>(null)
  const animationFrameIdRef = useRef<number | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const volumeRef = useRef(1)
  const onTrackEndedRef = useRef<(() => void) | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0)
  const [totalTrackDuration, setTotalTrackDuration] = useState(0)
  const [currentTrackName, setCurrentTrackName] = useState<string | null>(null)
  const [volume, setVolumeState] = useState(1)

  const cancelPositionLoop = (): void => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current)
      animationFrameIdRef.current = null
    }
  }

  const FADE_SECONDS = 0.03

  const rampGain = (target: number, seconds: number): void => {
    const audioContext = audioContextRef.current
    const gainNode = gainNodeRef.current
    if (!audioContext || !gainNode) return
    const now = audioContext.currentTime
    gainNode.gain.cancelScheduledValues(now)
    gainNode.gain.setValueAtTime(gainNode.gain.value, now)
    gainNode.gain.linearRampToValueAtTime(target, now + seconds)
  }

  const fadeOutThen = async (action: () => void): Promise<void> => {
    rampGain(0, FADE_SECONDS)
    await new Promise((resolve) => setTimeout(resolve, FADE_SECONDS * 1000 + 10))
    action()
  }

  const ensureGraph = (): HTMLAudioElement => {
    if (!audioElementRef.current) {
      const audioContext = new AudioContext()
      const gainNode = audioContext.createGain()
      gainNode.gain.value = volumeRef.current
      const analyserNode = audioContext.createAnalyser()
      analyserNode.fftSize = 2048
      gainNode.connect(analyserNode)
      analyserNode.connect(audioContext.destination)

      const audio = new Audio()
      audio.crossOrigin = 'anonymous'
      audio.preload = 'auto'
      audioContext.createMediaElementSource(audio).connect(gainNode)

      let lastShownTime = -1
      const updatePosition = (): void => {
        const currentTime = audio.currentTime
        if (Math.abs(currentTime - lastShownTime) >= 0.2) {
          lastShownTime = currentTime
          setCurrentPlaybackTime(currentTime)
        }
        animationFrameIdRef.current = requestAnimationFrame(updatePosition)
      }

      audio.addEventListener('loadedmetadata', () => {
        setTotalTrackDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
      })
      audio.addEventListener('play', () => {
        setIsPlaying(true)
        cancelPositionLoop()
        animationFrameIdRef.current = requestAnimationFrame(updatePosition)
      })
      audio.addEventListener('pause', () => {
        setIsPlaying(false)
        cancelPositionLoop()
        setCurrentPlaybackTime(audio.currentTime)
      })
      audio.addEventListener('ended', () => {
        audio.currentTime = 0
        setCurrentPlaybackTime(0)
        onTrackEndedRef.current?.()
      })
      audio.addEventListener('error', () => {
        console.error('Audio playback error:', audio.error)
      })
      audio.addEventListener('waiting', () => {
        console.warn(`[audio] waiting: decoder starved at ${audio.currentTime.toFixed(2)}s`)
      })
      audio.addEventListener('stalled', () => {
        console.warn(`[audio] stalled: no data arriving at ${audio.currentTime.toFixed(2)}s`)
      })

      audioContextRef.current = audioContext
      gainNodeRef.current = gainNode
      analyserNodeRef.current = analyserNode
      audioElementRef.current = audio
    }
    return audioElementRef.current
  }

  const startWithFadeIn = async (audio: HTMLAudioElement): Promise<void> => {
    if (audioContextRef.current?.state === 'suspended') await audioContextRef.current.resume()
    const audioContext = audioContextRef.current
    const gainNode = gainNodeRef.current
    if (audioContext && gainNode) {
      gainNode.gain.cancelScheduledValues(audioContext.currentTime)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    }
    try {
      await audio.play()
      rampGain(volumeRef.current, FADE_SECONDS)
    } catch (error) {
      console.error('Failed to play track:', error)
      rampGain(volumeRef.current, FADE_SECONDS)
    }
  }

  const loadTrack = async (url: string, name: string, autoplay = true): Promise<void> => {
    const audio = ensureGraph()

    if (!audio.paused) {
      await fadeOutThen(() => audio.pause())
    }

    audio.src = url
    setCurrentTrackName(name)
    setCurrentPlaybackTime(0)
    setTotalTrackDuration(0)

    if (autoplay) {
      await startWithFadeIn(audio)
    }
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (!event.target.files || event.target.files.length === 0) return
    const file = event.target.files[0]
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    objectUrlRef.current = URL.createObjectURL(file)
    await loadTrack(objectUrlRef.current, file.name.replace(/\.[^/.]+$/, ''), false)
  }

  const play = async (): Promise<void> => {
    const audio = audioElementRef.current
    if (!audio || !audio.src) return
    await startWithFadeIn(audio)
  }

  const pause = (): void => {
    const audio = audioElementRef.current
    if (!audio || audio.paused) return
    fadeOutThen(() => audio.pause())
  }

  const stop = (): void => {
    const audio = audioElementRef.current
    if (!audio) return
    const reset = (): void => {
      audio.pause()
      audio.currentTime = 0
      setCurrentPlaybackTime(0)
    }
    if (audio.paused) {
      reset()
    } else {
      fadeOutThen(reset)
    }
  }

  const seek = (seconds: number): void => {
    const audio = audioElementRef.current
    if (!audio || !Number.isFinite(audio.duration)) return
    const clamped = Math.max(0, Math.min(seconds, audio.duration))
    if (audio.paused) {
      audio.currentTime = clamped
      setCurrentPlaybackTime(clamped)
    } else {
      fadeOutThen(() => {
        audio.currentTime = clamped
        setCurrentPlaybackTime(clamped)
        rampGain(volumeRef.current, FADE_SECONDS)
      })
    }
  }

  const setVolume = (value: number): void => {
    const clamped = Math.max(0, Math.min(value, 1))
    volumeRef.current = clamped
    setVolumeState(clamped)
    rampGain(clamped, 0.01)
  }

  const getAnalyser = useCallback((): AnalyserNode | null => analyserNodeRef.current, [])

  const setOnTrackEnded = useCallback((callback: (() => void) | null): void => {
    onTrackEndedRef.current = callback
  }, [])

  useEffect(() => {
    return (): void => {
      cancelPositionLoop()
      audioElementRef.current?.pause()
      if (audioElementRef.current) audioElementRef.current.src = ''
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
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
    getAnalyser,
    setOnTrackEnded
  }
}

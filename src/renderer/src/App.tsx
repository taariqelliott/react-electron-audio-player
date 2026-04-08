import { ChangeEvent, JSX, useRef, useState } from 'react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'

export default function App(): JSX.Element {
  const audioCTX = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const startedAtRef = useRef<number>(0)
  const pausedAtRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)
  const isManualStopRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  const getAudioCTX = (): AudioContext => {
    if (!audioCTX.current || audioCTX.current.state === 'closed') {
      audioCTX.current = new AudioContext()
    }
    return audioCTX.current
  }

  const tick = (): void => {
    setCurrentTime(getAudioCTX().currentTime - startedAtRef.current)
    rafRef.current = requestAnimationFrame(tick)
  }

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (!event.target.files) return

    isManualStopRef.current = true
    sourceRef.current?.stop()
    sourceRef.current = null

    if (audioCTX.current) {
      await audioCTX.current.close()
    }

    audioCTX.current = new AudioContext()

    pausedAtRef.current = 0
    startedAtRef.current = 0
    setIsPlaying(false)
    setCurrentTime(0)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const file = event.target.files[0]
    const arrayBuffer = await file.arrayBuffer()
    bufferRef.current = await audioCTX.current.decodeAudioData(arrayBuffer)
  }

  const play = async (): Promise<void> => {
    if (!bufferRef.current) return
    const ctx = getAudioCTX()

    isManualStopRef.current = true
    sourceRef.current?.stop()
    sourceRef.current = null

    const source = ctx.createBufferSource()
    source.buffer = bufferRef.current
    source.connect(ctx.destination)
    source.start(0, pausedAtRef.current)
    startedAtRef.current = ctx.currentTime - pausedAtRef.current
    isManualStopRef.current = false

    source.onended = () => {
      if (isManualStopRef.current) {
        isManualStopRef.current = false
        return
      }
      sourceRef.current = null
      pausedAtRef.current = 0
      startedAtRef.current = 0
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      setCurrentTime(0)
      setIsPlaying(false)
    }

    sourceRef.current = source
    setIsPlaying(true)
    rafRef.current = requestAnimationFrame(tick)
  }

  const pause = (): void => {
    isManualStopRef.current = true
    sourceRef.current?.stop()
    pausedAtRef.current = getAudioCTX().currentTime - startedAtRef.current
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setIsPlaying(false)
  }

  const stop = (): void => {
    isManualStopRef.current = true
    sourceRef.current?.stop()
    sourceRef.current = null
    pausedAtRef.current = 0
    startedAtRef.current = 0
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setCurrentTime(0)
    setIsPlaying(false)
  }

  return (
    <div className="h-screen w-full justify-center items-center flex flex-col transition-all duration-100 gap-4">
      <p>Current time: {currentTime.toFixed(2)}s</p>
      <section className="flex gap-2">
        <Button className="w-18" onClick={isPlaying ? pause : play} variant="default">
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <Button className="w-18" onClick={stop} variant="default">
          Stop
        </Button>
      </section>
      <Input type="file" accept="audio/*" onChange={handleUpload} className="my-2 max-w-3/4" />
    </div>
  )
}

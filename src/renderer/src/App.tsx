import { Pause, Play, Square } from 'lucide-react'
import { ChangeEvent, JSX, useRef, useState } from 'react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { manifest } from './testfiles/manifest.json'

export default function App(): JSX.Element {
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const decodedBufferRef = useRef<AudioBuffer | null>(null)
  const playbackStartRef = useRef<number>(0)
  const playbackPauseRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)
  const manualStopRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [trackDuration, setTrackDuration] = useState(0)

  const getAudioContext = (): AudioContext => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext()
    }
    return audioContextRef.current
  }

  const updatePlaybackTime = (): void => {
    setPlaybackTime(getAudioContext().currentTime - playbackStartRef.current)
    animationFrameRef.current = requestAnimationFrame(updatePlaybackTime)
  }

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (!event.target.files) return

    manualStopRef.current = true
    sourceNodeRef.current?.stop()
    sourceNodeRef.current = null

    if (audioContextRef.current) {
      await audioContextRef.current.close()
    }

    audioContextRef.current = new AudioContext()

    playbackPauseRef.current = 0
    playbackStartRef.current = 0
    setIsPlaying(false)
    setPlaybackTime(0)
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)

    const file = event.target.files[0]
    const rawBytes = await file.arrayBuffer()
    decodedBufferRef.current = await audioContextRef.current.decodeAudioData(rawBytes)
    const duration = decodedBufferRef.current.duration
    setTrackDuration(duration)
  }

  const play = async (): Promise<void> => {
    if (!decodedBufferRef.current) return
    const audioContext = getAudioContext()

    manualStopRef.current = true
    sourceNodeRef.current?.stop()
    sourceNodeRef.current = null

    const sourceNode = audioContext.createBufferSource()
    sourceNode.buffer = decodedBufferRef.current
    sourceNode.connect(audioContext.destination)
    sourceNode.start(0, playbackPauseRef.current)
    playbackStartRef.current = audioContext.currentTime - playbackPauseRef.current
    manualStopRef.current = false

    sourceNode.onended = () => {
      if (manualStopRef.current) {
        manualStopRef.current = false
        return
      }
      sourceNodeRef.current = null
      playbackPauseRef.current = 0
      playbackStartRef.current = 0
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      setPlaybackTime(0)
      setIsPlaying(false)
    }

    sourceNodeRef.current = sourceNode
    setIsPlaying(true)
    animationFrameRef.current = requestAnimationFrame(updatePlaybackTime)
    console.log(trackDuration)
  }

  const pause = (): void => {
    manualStopRef.current = true
    sourceNodeRef.current?.stop()
    playbackPauseRef.current = getAudioContext().currentTime - playbackStartRef.current
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    setIsPlaying(false)
  }

  const stop = (): void => {
    manualStopRef.current = true
    sourceNodeRef.current?.stop()
    sourceNodeRef.current = null
    playbackPauseRef.current = 0
    playbackStartRef.current = 0
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    setPlaybackTime(0)
    setIsPlaying(false)
  }

  console.log(Object.entries(manifest))

  return (
    <div className="h-screen w-full justify-center items-center flex flex-col transition-all duration-100 gap-4 bg-primary-foreground">
      <p className="flex gap-1">
        Current time: <span className="tabular-nums">{playbackTime.toFixed(2)}s</span>
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
        onChange={handleUpload}
        className="my-2 max-w-3/4 hover:opacity-85 transition-opacity duration-200 cursor-pointer"
      />
      <div className="w-3/4 relative bg-teal-500 h-6 rounded overflow-hidden">
        <div
          className={`absolute bg-yellow-200 h-6`}
          style={{ width: `${(playbackTime / trackDuration) * 100}%` }}
        ></div>
      </div>
      {/* {tracks.map(({ addedAt, artist, duration, file, order, title }) => (
        <div
          key={addedAt}
          className="flex flex-col bg-accent-foreground text-primary-foreground w-2/6 rounded px-4"
        >
          <p>{artist}</p>
          <p>{duration}</p>
          <p>{file}</p>
          <p>{order}</p>
          <p>{title}</p>
        </div>
      ))} */}
    </div>
  )
}

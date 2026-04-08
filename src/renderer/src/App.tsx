import { useRef, useState } from 'react'
import wavFile from './assets/4urluv.wav'
import { Button } from './components/ui/button'

export default function App() {
  const audioCTX = useRef(new AudioContext())
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const load = async () => {
    const response = await fetch(wavFile)
    console.log(response)
    const arrayBuffer = await response.arrayBuffer()
    console.log(arrayBuffer)
    bufferRef.current = await audioCTX.current.decodeAudioData(arrayBuffer)
  }

  const play = async () => {
    if (!bufferRef.current) await load()
    const source = audioCTX.current.createBufferSource()
    source.buffer = bufferRef.current
    source.connect(audioCTX.current.destination)
    source.start()
    sourceRef.current = source
    setIsPlaying(true)
  }

  const pause = () => {
    sourceRef.current?.stop()
    setIsPlaying(false)
  }

  const stop = () => {
    sourceRef.current?.stop()
    sourceRef.current = null
    setIsPlaying(false)
  }

  return (
    <div className="bg-[#0a0ae9ed] md:bg-lime-500 h-screen w-full justify-center items-center flex flex-col transition-all duration-100 text-zinc-50 md:text-zinc-900">
      <Button onClick={isPlaying ? pause : play}>{isPlaying ? 'Pause' : 'Play'}</Button>
      <Button onClick={stop}>Stop</Button>
    </div>
  )
}

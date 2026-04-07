import { ArrowUpIcon } from 'lucide-react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { ChangeEvent, useState } from 'react'

export default function App() {
  const [audioSRC, setAudioSRC] = useState<string | undefined>()
  const thing = () => window.logger.logNumber(12)
  const logTaariq = () => window.bridge.logTaariq()

  const node = window.versions.node()
  const chrome = window.versions.chrome()
  const electron = window.versions.electron()

  const audioCTX = new AudioContext()

  const handleUploadAudio = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return

    const file = event.target.files[0]
    const buff = await file.arrayBuffer()
    const audioctx = await audioCTX.decodeAudioData(buff)
    console.log('Decoded audio buffer:', audioctx)

    const url = URL.createObjectURL(file)
    setAudioSRC(url)
  }

  return (
    <div className="bg-[#0a0ae9ed] md:bg-red-500 h-screen w-full justify-center items-center flex flex-col transition-all duration-100 text-zinc-50 md:text-zinc-900">
      <p className="text-lime-400">Audio Player v2.1</p>
      <div className="flex gap-5 items-center flex-col md:flex-row">
        <p>Node: {node}</p>
        <p>Chrome: {chrome}</p>
        <p>Electron: {electron}</p>

        <Button onClick={thing} variant="outline" className="text-primary">
          Button
        </Button>
        <Button
          onClick={logTaariq}
          variant="outline"
          size="icon"
          aria-label="Submit"
          className="text-primary"
        >
          <ArrowUpIcon />
        </Button>
      </div>
      <Input type="file" className="w-1/2 my-3" onChange={handleUploadAudio} />
      <audio src={audioSRC} controls />
    </div>
  )
}

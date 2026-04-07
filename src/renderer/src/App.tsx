import { ArrowUpIcon } from 'lucide-react'
import { Button } from './components/ui/button'

export default function App() {
  return (
    <div className="bg-[#1414cf] h-screen w-full justify-center items-center flex flex-col">
      <p className="text-lime-400">Audio Player v2.1</p>
      <div className="flex flex-wrap items-center gap-2 md:flex-row">
        <Button variant="outline">Button</Button>
        <Button variant="outline" size="icon" aria-label="Submit">
          <ArrowUpIcon />
        </Button>
      </div>
    </div>
  )
}

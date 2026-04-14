import { Loader2 } from 'lucide-react'
import { JSX } from 'react'

export function LoadingScreen(): JSX.Element {
  return (
    <div className="h-screen w-full bg-primary-foreground items-center justify-center flex flex-col gap-2">
      <Loader2 className="animate-spin" size={32} />
      <p>Loading</p>
    </div>
  )
}

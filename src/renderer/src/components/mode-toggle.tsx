import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'
import { JSX } from 'react'
import { useTheme } from './use-theme'

export function ModeToggle(): JSX.Element {
  const { theme, setTheme } = useTheme()

  const toggle = (): void => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <Button variant="outline" size="icon" onClick={toggle} className="absolute top-1 right-1">
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

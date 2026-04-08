import { createContext, useContext } from 'react'

export type Theme = 'dark' | 'light' | 'system'

export type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null
}

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export const useTheme = (): ThemeProviderState => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}

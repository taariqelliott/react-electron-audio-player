export type AppConfig = {
  libraryRoot: string | null
}

declare global {
  interface Window {
    musicPlayer: {
      selectLibraryRoot: () => Promise<string | null>
      readConfigFile: () => Promise<AppConfig>
    }
  }
}

export {}

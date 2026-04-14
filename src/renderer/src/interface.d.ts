declare global {
  interface Window {
    musicPlayer: {
      selectLibraryRoot: () => Promise<string | null>
      readConfigFile: () => Promise<AppConfig>
      createFolder: (args: CreateFolderArgs) => Promise<Manifest>
      libraryRootExists: (path: string) => Promise<boolean>
    }
  }
}

export {}

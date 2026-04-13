declare global {
  interface Window {
    api: {
      selectLibraryRoot: () => Promise<string | null>
      readConfigFile: () => Promise<ConfigRoot>
    }
  }
}

export {}

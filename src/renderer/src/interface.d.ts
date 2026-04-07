declare global {
  interface Window {
    logger: {
      logNumber: (num: number) => void
    }
    bridge: {
      logTaariq: () => void
    }
    versions: {
      node: () => string
      chrome: () => string
      electron: () => string
    }
  }
}

export {}

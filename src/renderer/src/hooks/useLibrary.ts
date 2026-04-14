import { AppConfig, Manifest } from '@shared/types'
import { useEffect, useState } from 'react'

export function useLibrary(): {
  appConfig: AppConfig | undefined
  libraryRootExists: boolean | undefined
  isLoadingConfig: boolean
  folders: Manifest[]
  folderName: string
  folderType: string
  folderArtist: string
  setFolderName: (value: string) => void
  setFolderType: (value: string) => void
  setFolderArtist: (value: string) => void
  selectLibraryRoot: () => Promise<void>
  createFolder: () => Promise<void>
} {
  const [appConfig, setAppConfig] = useState<AppConfig>()
  const [libraryRootExists, setLibraryRootExists] = useState<boolean>()
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [folders, setFolders] = useState<Manifest[]>([])
  const [folderName, setFolderName] = useState('')
  const [folderType, setFolderType] = useState('')
  const [folderArtist, setFolderArtist] = useState('')

  useEffect((): void => {
    const loadAppConfig = async (): Promise<void> => {
      try {
        const config = await window.musicPlayer.readConfigFile()
        setAppConfig(config)
      } catch (error) {
        console.error('Failed to load config:', error)
        setAppConfig({ libraryRoot: null })
      } finally {
        setIsLoadingConfig(false)
      }
    }
    loadAppConfig()
  }, [])

  useEffect((): void => {
    const verifyLibraryRootExists = async (): Promise<void> => {
      if (!appConfig?.libraryRoot) return
      const exists = await window.musicPlayer.libraryRootExists(appConfig.libraryRoot)
      setLibraryRootExists(exists)
    }
    verifyLibraryRootExists()
  }, [appConfig])

  const selectLibraryRoot = async (): Promise<void> => {
    const selectedPath = await window.musicPlayer.selectLibraryRoot()
    setAppConfig({ libraryRoot: selectedPath })
  }

  const createFolder = async (): Promise<void> => {
    const newFolder = await window.musicPlayer.createFolder({
      artist: folderArtist,
      name: folderName,
      type: folderType
    })
    setFolders((prev) => [...prev, newFolder])
    setFolderArtist('')
    setFolderType('')
    setFolderName('')
  }

  return {
    appConfig,
    libraryRootExists,
    isLoadingConfig,
    folders,
    folderName,
    folderType,
    folderArtist,
    setFolderName,
    setFolderType,
    setFolderArtist,
    selectLibraryRoot,
    createFolder
  }
}

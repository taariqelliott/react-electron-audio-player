import { useAlbumStore } from '@shared/store'
import { AppConfig, Manifest } from '@shared/types'
import { useEffect, useState } from 'react'

export function useLibrary(): {
  appConfig: AppConfig | undefined
  libraryRootExists: boolean | undefined
  isLoadingConfig: boolean
  isLoadingFolders: boolean
  folders: Manifest[]
  folderName: string
  folderType: string
  folderArtist: string
  setFolderName: (value: string) => void
  setFolderType: (value: string) => void
  setFolderArtist: (value: string) => void
  setFolderArtwork: (file: File | null) => void
  selectLibraryRoot: () => Promise<void>
  createFolder: () => Promise<void>
  applyLibraryRoot: (libraryRoot: string) => void
  applyConfig: (config: AppConfig) => void
  importFolder: () => Promise<void>
} {
  const [appConfig, setAppConfig] = useState<AppConfig>()
  const [libraryRootExists, setLibraryRootExists] = useState<boolean>()
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [isLoadingFolders, setIsLoadingFolders] = useState(true)
  const [folderName, setFolderName] = useState('')
  const [folderType, setFolderType] = useState('')
  const [folderArtist, setFolderArtist] = useState('')
  const [folderArtwork, setFolderArtwork] = useState<File | null>(null)

  const folders = useAlbumStore((state) => state.folders)
  const setFolders = useAlbumStore((state) => state.setFolders)
  const addFolder = useAlbumStore((state) => state.addFolder)
  const applyManifest = useAlbumStore((state) => state.applyManifest)
  const updateActiveFolder = useAlbumStore((state) => state.updateActiveFolder)

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

  useEffect((): void => {
    if (!libraryRootExists) return
    const loadFolders = async (): Promise<void> => {
      setIsLoadingFolders(true)
      try {
        const manifests = await window.musicPlayer.getFolders()
        setFolders(manifests)
      } finally {
        setIsLoadingFolders(false)
      }
    }
    loadFolders()
  }, [libraryRootExists, setFolders])

  const selectLibraryRoot = async (): Promise<void> => {
    const selectedPath = await window.musicPlayer.selectLibraryRoot()
    if (selectedPath === null) return
    setAppConfig({ libraryRoot: selectedPath })
  }

  const createFolder = async (): Promise<void> => {
    const newFolder = await window.musicPlayer.createFolder({
      artist: folderArtist,
      name: folderName,
      type: folderType
    })

    let folderToAdd = newFolder

    if (folderArtwork) {
      const filePath = window.musicPlayer.getFilePath(folderArtwork)
      const updatedFolder = await window.musicPlayer.uploadArtwork({
        folderPath: newFolder.folderPath,
        filePath
      })
      folderToAdd = updatedFolder
    }

    addFolder(folderToAdd)
    setFolderArtist('')
    setFolderType('')
    setFolderName('')
    setFolderArtwork(null)
  }

  const applyLibraryRoot = (libraryRoot: string): void => {
    setAppConfig((prev) => ({ ...prev, libraryRoot }))
  }

  const applyConfig = (config: AppConfig): void => {
    setAppConfig(config)
  }

  const importFolder = async (): Promise<void> => {
    const manifest = await window.musicPlayer.importFolder()
    if (!manifest) return
    applyManifest(manifest)
    updateActiveFolder(manifest)
  }

  return {
    appConfig,
    libraryRootExists,
    isLoadingConfig,
    isLoadingFolders,
    folders,
    folderName,
    folderType,
    folderArtist,
    setFolderName,
    setFolderArtwork,
    setFolderType,
    setFolderArtist,
    selectLibraryRoot,
    createFolder,
    applyLibraryRoot,
    applyConfig,
    importFolder
  }
}

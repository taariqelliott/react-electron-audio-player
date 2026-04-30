import { create } from 'zustand'
import { Manifest } from './types'

type State = {
  activeFolder: Manifest | null
}

type Action = {
  updateActiveFolder: (activeFolder: Manifest | null) => void
}

export const useAlbumStore = create<State & Action>((set) => ({
  activeFolder: null,
  updateActiveFolder: (activeFolder) => set({ activeFolder })
}))

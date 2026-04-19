import { create } from 'zustand'

type State = {
  activeAlbumName: string
}

type Action = {
  updateActiveAlbum: (activeAlbumName: State['activeAlbumName']) => void
}

export const useAlbumStore = create<State & Action>((set) => ({
  activeAlbumName: '',
  updateActiveAlbum: (activeAlbumName) => set(() => ({ activeAlbumName: activeAlbumName }))
}))

import { create } from 'zustand'
import type { SceneState, DeezerTrack } from '../types'

interface SceneStoreState {
  state: SceneState
  scrollPosition: number
  selectedVinylId: number | null
  tracks: DeezerTrack[]
  albumTracks: DeezerTrack[]

  setState: (state: SceneState) => void
  setScrollPosition: (position: number) => void
  selectVinyl: (trackId: number) => void
  clearSelection: () => void
  setTracks: (tracks: DeezerTrack[]) => void
  setAlbumTracks: (tracks: DeezerTrack[]) => void
}

export const useSceneStore = create<SceneStoreState>((set) => ({
  state: 'browsing',
  scrollPosition: 0,
  selectedVinylId: null,
  tracks: [],
  albumTracks: [],

  setState: (state) => set({ state }),
  setScrollPosition: (scrollPosition) => set({ scrollPosition }),
  selectVinyl: (trackId) => set({ selectedVinylId: trackId, state: 'animating' }),
  clearSelection: () => set({ selectedVinylId: null, state: 'browsing', albumTracks: [] }),
  setTracks: (tracks) => set({ tracks }),
  setAlbumTracks: (albumTracks) => set({ albumTracks }),
}))

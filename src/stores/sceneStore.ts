import { create } from 'zustand'
import type { SceneState, DeezerTrack } from '../types'

interface SceneStoreState {
  state: SceneState
  scrollPosition: number
  selectedVinylId: number | null
  animationStartedAt: number
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
  animationStartedAt: 0,
  tracks: [],
  albumTracks: [],

  setState: (state) => set({ state }),
  setScrollPosition: (scrollPosition) => set({ scrollPosition }),
  selectVinyl: (trackId) =>
    set({ selectedVinylId: trackId, state: 'animating', animationStartedAt: Date.now() }),
  clearSelection: () =>
    set({
      selectedVinylId: null,
      state: 'browsing',
      albumTracks: [],
      animationStartedAt: 0,
    }),
  setTracks: (tracks) => set({ tracks }),
  setAlbumTracks: (albumTracks) => set({ albumTracks }),
}))

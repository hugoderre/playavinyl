import { create } from 'zustand'
import type { SceneState, DeezerTrack } from '../types'

interface SceneStoreState {
  state: SceneState
  scrollPosition: number
  selectedVinylId: number | null
  animationStartedAt: number
  tracks: DeezerTrack[]
  albumTracks: DeezerTrack[]
  isFetchingMore: boolean
  hasMore: boolean
  mode: 'charts' | 'search' | 'genre' | 'crate' | 'related'
  currentGenreId: number
  relatedTracks: DeezerTrack[]
  loadError: boolean

  setState: (state: SceneState) => void
  setScrollPosition: (position: number) => void
  selectVinyl: (trackId: number) => void
  clearSelection: () => void
  setTracks: (tracks: DeezerTrack[], mode?: 'charts' | 'search') => void
  setGenreTracks: (tracks: DeezerTrack[], genreId: number) => void
  setCrateTracks: (tracks: DeezerTrack[]) => void
  storeRelatedTracks: (tracks: DeezerTrack[]) => void
  loadRelatedAsBag: () => void
  appendTracks: (newTracks: DeezerTrack[]) => void
  setAlbumTracks: (tracks: DeezerTrack[]) => void
  setFetchingMore: (v: boolean) => void
  setHasMore: (v: boolean) => void
  setLoadError: (v: boolean) => void
}

export const useSceneStore = create<SceneStoreState>((set) => ({
  state: 'browsing',
  scrollPosition: 0,
  selectedVinylId: null,
  animationStartedAt: 0,
  tracks: [],
  albumTracks: [],
  isFetchingMore: false,
  hasMore: true,
  mode: 'charts',
  currentGenreId: 0,
  relatedTracks: [],
  loadError: false,

  setState: (state) => set({ state }),
  setScrollPosition: (scrollPosition) =>
    set((s) => ({
      scrollPosition: Math.max(0, Math.min(Math.max(0, s.tracks.length - 1), scrollPosition)),
    })),
  selectVinyl: (trackId) =>
    set({ selectedVinylId: trackId, state: 'animating', animationStartedAt: Date.now() }),
  clearSelection: () =>
    set({
      selectedVinylId: null,
      state: 'browsing',
      albumTracks: [],
      animationStartedAt: 0,
    }),
  // Reset scroll to the first record whenever the deck changes (charts ↔
  // search ↔ different searches), so the user always lands on the new collection's hero.
  setTracks: (tracks, mode) =>
    set((s) => ({ tracks, scrollPosition: 0, isFetchingMore: false, hasMore: true, mode: mode ?? s.mode })),
  setGenreTracks: (tracks, genreId) =>
    set({ tracks, scrollPosition: 0, isFetchingMore: false, hasMore: true, mode: 'genre', currentGenreId: genreId }),
  setCrateTracks: (tracks) =>
    set({ tracks, scrollPosition: 0, isFetchingMore: false, hasMore: false, mode: 'crate' }),
  storeRelatedTracks: (relatedTracks) => set({ relatedTracks }),
  loadRelatedAsBag: () =>
    set((s) => s.relatedTracks.length > 0
      ? { tracks: s.relatedTracks, scrollPosition: 0, isFetchingMore: false, hasMore: false, mode: 'related' }
      : {},
    ),
  appendTracks: (newTracks) =>
    set((s) => {
      const existingIds = new Set(s.tracks.map((t) => t.id))
      const unique = newTracks.filter((t) => !existingIds.has(t.id))
      return unique.length > 0 ? { tracks: [...s.tracks, ...unique] } : {}
    }),
  setAlbumTracks: (albumTracks) => set({ albumTracks }),
  setFetchingMore: (isFetchingMore) => set({ isFetchingMore }),
  setHasMore: (hasMore) => set({ hasMore }),
  setLoadError: (loadError) => set({ loadError }),
}))

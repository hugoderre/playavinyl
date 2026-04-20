import { create } from 'zustand'
import type { DeezerTrack } from '../types'

interface PlayerStoreState {
  currentTrack: DeezerTrack | null
  isPlaying: boolean
  progress: number

  play: (track: DeezerTrack) => void
  stop: () => void
  setProgress: (progress: number) => void
}

export const usePlayerStore = create<PlayerStoreState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  progress: 0,

  play: (track) => set({ currentTrack: track, isPlaying: true, progress: 0 }),
  stop: () => set({ isPlaying: false, progress: 0 }),
  setProgress: (progress) => set({ progress }),
}))

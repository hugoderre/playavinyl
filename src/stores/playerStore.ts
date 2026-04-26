import { create } from 'zustand'
import type { DeezerTrack } from '../types'

interface PlayerStoreState {
  currentTrack: DeezerTrack | null
  isPlaying: boolean
  progress: number
  // True when the browser blocked audio.play() because no user gesture
  // had occurred yet — the UI surfaces a "tap to play" affordance.
  autoplayBlocked: boolean

  play: (track: DeezerTrack) => void
  setPlaying: (isPlaying: boolean) => void
  stop: () => void
  setProgress: (progress: number) => void
  setAutoplayBlocked: (blocked: boolean) => void
}

export const usePlayerStore = create<PlayerStoreState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  autoplayBlocked: false,

  play: (track) =>
    set({ currentTrack: track, isPlaying: false, progress: 0, autoplayBlocked: false }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  stop: () => set({ isPlaying: false, progress: 0 }),
  setProgress: (progress) => set({ progress }),
  setAutoplayBlocked: (autoplayBlocked) => set({ autoplayBlocked }),
}))

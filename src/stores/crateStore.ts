import { create } from 'zustand'
import type { DeezerTrack } from '../types'

const STORAGE_KEY = 'playavinyl_crate'
const MAX_TRACKS = 20

function loadFromStorage(): DeezerTrack[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DeezerTrack[]) : []
  } catch {
    return []
  }
}

function saveToStorage(tracks: DeezerTrack[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks))
  } catch {
    // localStorage peut être indisponible (mode privé saturé, etc.)
  }
}

interface CrateStoreState {
  tracks: DeezerTrack[]
  addTrack: (track: DeezerTrack) => void
  clearCrate: () => void
}

export const useCrateStore = create<CrateStoreState>((set) => ({
  tracks: loadFromStorage(),

  addTrack: (track) =>
    set((s) => {
      const deduped = s.tracks.filter((t) => t.id !== track.id)
      const updated = [track, ...deduped].slice(0, MAX_TRACKS)
      saveToStorage(updated)
      return { tracks: updated }
    }),

  clearCrate: () => {
    localStorage.removeItem(STORAGE_KEY)
    return { tracks: [] }
  },
}))

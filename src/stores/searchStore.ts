import { create } from 'zustand'
import type { DeezerTrack } from '../types'

interface SearchStoreState {
  query: string
  results: DeezerTrack[]
  isLoading: boolean
  isSearchActive: boolean

  setQuery: (query: string) => void
  setResults: (results: DeezerTrack[]) => void
  setLoading: (loading: boolean) => void
  clearSearch: () => void
}

export const useSearchStore = create<SearchStoreState>((set) => ({
  query: '',
  results: [],
  isLoading: false,
  isSearchActive: false,

  setQuery: (query) => set({ query, isSearchActive: query.length > 0 }),
  setResults: (results) => set({ results }),
  setLoading: (isLoading) => set({ isLoading }),
  clearSearch: () => set({ query: '', results: [], isSearchActive: false, isLoading: false }),
}))

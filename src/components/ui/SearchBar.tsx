import type { ReactElement } from 'react'
import { useCallback } from 'react'
import { useSearchStore } from '../../stores/searchStore'
import { useSceneStore } from '../../stores/sceneStore'
import { useDeezerSearch } from '../../hooks/useDeezer'

export function SearchBar(): ReactElement {
  const query = useSearchStore((s) => s.query)
  const setQuery = useSearchStore((s) => s.setQuery)
  const setResults = useSearchStore((s) => s.setResults)
  const setLoading = useSearchStore((s) => s.setLoading)
  const clearSearch = useSearchStore((s) => s.clearSearch)
  const setTracks = useSceneStore((s) => s.setTracks)
  const isLoading = useSearchStore((s) => s.isLoading)

  const handleResults = useCallback((tracks: Parameters<typeof setResults>[0]) => {
    setResults(tracks)
    setTracks(tracks)
  }, [setResults, setTracks])

  useDeezerSearch(query, handleResults, setLoading)

  const handleClear = (): void => {
    clearSearch()
    // Trending will reload via useChartTracks in App
  }

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un artiste, un titre..."
          className="w-full h-11 px-5 pr-10 rounded-full
            bg-[var(--color-surface)] backdrop-blur-md
            border border-[var(--color-border)]
            text-[var(--color-text)] text-sm
            placeholder:text-[var(--color-text-muted)]
            outline-none focus:border-[var(--color-accent)]
            transition-colors"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {query && !isLoading && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

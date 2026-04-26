import type { ReactElement } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import { useSearchStore } from '../../stores/searchStore'
import { useSceneStore } from '../../stores/sceneStore'
import { useDeezerSearch } from '../../hooks/useDeezer'
import { getChartTracks } from '../../api/deezer'

export function SearchBar(): ReactElement | null {
  const query = useSearchStore((s) => s.query)
  const setQuery = useSearchStore((s) => s.setQuery)
  const setResults = useSearchStore((s) => s.setResults)
  const setLoading = useSearchStore((s) => s.setLoading)
  const clearSearch = useSearchStore((s) => s.clearSearch)
  const setTracks = useSceneStore((s) => s.setTracks)
  const isLoading = useSearchStore((s) => s.isLoading)
  const sceneState = useSceneStore((s) => s.state)

  const handleResults = useCallback(
    (tracks: Parameters<typeof setResults>[0]) => {
      setResults(tracks)
      setTracks(tracks)
    },
    [setResults, setTracks],
  )

  useDeezerSearch(query, handleResults, setLoading)

  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = useCallback((): void => {
    clearSearch()
    // Restore the charts. fetchCached hits the in-memory cache — no extra round-trip.
    getChartTracks().then((charts) => setTracks(charts))
  }, [clearSearch, setTracks])

  // ESC inside the search clears the query and blurs the input — matches
  // the standard search-field UX (see GitHub, Spotify, Linear, etc.).
  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        if (query.length > 0) {
          e.preventDefault()
          handleClear()
        }
        input.blur()
      }
    }
    input.addEventListener('keydown', onKey)
    return (): void => input.removeEventListener('keydown', onKey)
  }, [query, handleClear])

  // Cmd/Ctrl+K — universal "open search" gesture. Focus the input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return (): void => window.removeEventListener('keydown', onKey)
  }, [])

  // Search is a browsing affordance — at the turntable the user is listening,
  // not searching, so we hide it to keep the playing scene serene.
  if (sceneState !== 'browsing') return null

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
      <div
        className="
          relative flex items-center
          h-12 rounded-full
          bg-black/55 backdrop-blur-xl
          border border-white/[0.10]
          focus-within:border-white/30 focus-within:bg-black/65
          shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]
          transition-colors
        "
      >
        {/* Search glyph — absolute so it never displaces the input */}
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="none"
          className="absolute left-5 text-white/40 pointer-events-none"
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M11 11L14 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un titre, un artiste"
          aria-label="Rechercher"
          className="
            w-full h-full pl-12 pr-12
            bg-transparent
            text-white text-[14px]
            placeholder:text-white/40
            outline-none
            text-ellipsis
          "
        />

        {/* Loading spinner — replaces the clear button while debouncing */}
        {isLoading && (
          <div className="absolute right-5">
            <div className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {query && !isLoading && (
          <button
            onClick={handleClear}
            aria-label="Effacer la recherche"
            className="
              absolute right-3 size-7 flex items-center justify-center rounded-full
              text-white/50 hover:text-white hover:bg-white/[0.06]
              transition-colors cursor-pointer
            "
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 2L10 10M10 2L2 10"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

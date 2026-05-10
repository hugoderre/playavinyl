import type { ReactElement } from 'react'
import { useState } from 'react'
import { useSceneStore } from '../../stores/sceneStore'
import { useCrateStore } from '../../stores/crateStore'
import { getGenreTracks } from '../../api/deezer'

const GENRES = [
  { id: 0, label: 'Charts' },
  { id: 132, label: 'Pop' },
  { id: 116, label: 'Hip-hop' },
  { id: 152, label: 'Rock' },
  { id: 129, label: 'Jazz' },
  { id: 106, label: 'Électro' },
  { id: 165, label: 'Soul' },
] as const

export function GenreSelector(): ReactElement | null {
  const sceneState = useSceneStore((s) => s.state)
  const mode = useSceneStore((s) => s.mode)
  const currentGenreId = useSceneStore((s) => s.currentGenreId)
  const setTracks = useSceneStore((s) => s.setTracks)
  const setGenreTracks = useSceneStore((s) => s.setGenreTracks)
  const setCrateTracks = useSceneStore((s) => s.setCrateTracks)
  const loadRelatedAsBag = useSceneStore((s) => s.loadRelatedAsBag)
  const relatedTracks = useSceneStore((s) => s.relatedTracks)
  const relatedArtistName = useSceneStore((s) => s.relatedArtistName)
  const crateTrack = useCrateStore((s) => s.tracks)

  const [loadingId, setLoadingId] = useState<number | null>(null)

  if (sceneState !== 'browsing') return null

  const activeId = mode === 'search' || mode === 'crate' || mode === 'related' ? null : currentGenreId

  async function handleGenre(genreId: number): Promise<void> {
    setLoadingId(genreId)
    try {
      const tracks = await getGenreTracks(genreId)
      if (genreId === 0) {
        setTracks(tracks, 'charts')
      } else {
        setGenreTracks(tracks, genreId)
      }
    } finally {
      setLoadingId(null)
    }
  }

  function handleCrate(): void {
    setCrateTracks(crateTrack)
  }

  return (
    <div className="absolute top-[4.75rem] left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 animate-fade-in-soft">
      {GENRES.map((g) => {
        const isActive = activeId === g.id
        const isLoading = loadingId === g.id
        return (
          <button
            key={g.id}
            onClick={() => { void handleGenre(g.id) }}
            disabled={isLoading}
            className={`
              px-3 py-1 rounded-full text-[11px] font-medium tracking-wide
              transition-all duration-200 cursor-pointer
              ${isActive
                ? 'bg-white/12 text-white/90 border border-white/20'
                : 'text-white/35 hover:text-white/65 border border-transparent hover:border-white/10'
              }
              ${isLoading ? 'opacity-50' : ''}
            `}
          >
            {isLoading ? '·' : g.label}
          </button>
        )
      })}

      {(crateTrack.length > 0 || relatedTracks.length > 0) && (
        <>
          <span className="text-white/15 text-xs mx-0.5">|</span>

          {relatedTracks.length > 0 && relatedArtistName && (
            <button
              onClick={loadRelatedAsBag}
              className={`
                flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide
                transition-all duration-200 cursor-pointer
                ${mode === 'related'
                  ? 'bg-white/12 text-white/90 border border-white/20'
                  : 'text-white/35 hover:text-white/65 border border-transparent hover:border-white/10'
                }
              `}
            >
              <span className="opacity-60">~</span>
              {relatedArtistName}
            </button>
          )}

          {crateTrack.length > 0 && (
            <button
              onClick={handleCrate}
              className={`
                flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide
                transition-all duration-200 cursor-pointer
                ${mode === 'crate'
                  ? 'bg-white/12 text-white/90 border border-white/20'
                  : 'text-white/35 hover:text-white/65 border border-transparent hover:border-white/10'
                }
              `}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
                <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.1" />
                <path d="M5 2.8V5L6.3 6.3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Récents
            </button>
          )}
        </>
      )}
    </div>
  )
}

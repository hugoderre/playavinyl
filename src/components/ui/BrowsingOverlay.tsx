import type { ReactElement } from 'react'
import { useSceneStore } from '../../stores/sceneStore'

const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window

const BAC_LABELS: Record<string, string> = {
  charts: 'Charts',
  search: '',
  genre: '',
  related: 'Dans la même veine',
  crate: 'Récents',
}

export function BrowsingOverlay(): ReactElement | null {
  const sceneState = useSceneStore((s) => s.state)
  const tracks = useSceneStore((s) => s.tracks)
  const scrollPosition = useSceneStore((s) => s.scrollPosition)
  const mode = useSceneStore((s) => s.mode)
  const currentGenreId = useSceneStore((s) => s.currentGenreId)
  const relatedArtistName = useSceneStore((s) => s.relatedArtistName)

  if (sceneState !== 'browsing' || tracks.length === 0) return null

  const centerIdx = Math.round(scrollPosition)
  const current = tracks[centerIdx]
  if (!current) return null

  // Pour le mode genre, le label vient du sélecteur de genres
  const GENRE_LABELS: Record<number, string> = {
    0: 'Charts',
    132: 'Pop',
    116: 'Hip-hop',
    152: 'Rock',
    129: 'Jazz',
    106: 'Électro',
    165: 'Soul',
  }
  const bacLabel = mode === 'genre'
    ? (GENRE_LABELS[currentGenreId] ?? '')
    : mode === 'related' && relatedArtistName
      ? `~ ${relatedArtistName}`
      : BAC_LABELS[mode] ?? ''

  return (
    <>
      {/* Title + artist — bottom-left */}
      <div className="absolute bottom-6 left-8 z-40 max-w-md pointer-events-none animate-fade-in-soft">
        {bacLabel && (
          <p className="text-white/30 text-[10px] uppercase tracking-[0.28em] mb-2">
            {bacLabel}
          </p>
        )}
        <h1 className="text-[var(--color-text)] text-2xl font-bold leading-tight tracking-tight">
          {current.title_short}
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">
          {current.artist.name}
        </p>
      </div>

      {/* Scroll / swipe affordance — bottom-right. Fades once the user takes the cue. */}
      <div
        className="absolute bottom-8 right-10 z-40 flex flex-col items-center gap-2 pointer-events-none transition-opacity duration-700"
        style={{ opacity: scrollPosition < 0.5 ? 0.6 : 0 }}
      >
        {isTouchDevice ? (
          /* Mobile: horizontal swipe hint */
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1">
              <span className="swipe-arrow text-white/85 text-xs">←</span>
              <span className="swipe-arrow-right text-white/85 text-xs">→</span>
            </div>
            <span className="text-white/55 text-[10px] uppercase tracking-[0.32em]">
              swipe
            </span>
          </div>
        ) : (
          /* Desktop: vertical pellet */
          <>
            <span className="text-white/55 text-[10px] uppercase tracking-[0.32em]">
              scroll
            </span>
            <div className="relative h-7 w-px bg-white/15 overflow-hidden rounded-full">
              <span className="scroll-pellet absolute left-1/2 -translate-x-1/2 size-1 -ml-[1.5px] rounded-full bg-white/85" />
            </div>
          </>
        )}
      </div>
    </>
  )
}

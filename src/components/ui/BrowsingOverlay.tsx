import type { ReactElement } from 'react'
import { useSceneStore } from '../../stores/sceneStore'

export function BrowsingOverlay(): ReactElement | null {
  const sceneState = useSceneStore((s) => s.state)
  const tracks = useSceneStore((s) => s.tracks)
  const scrollPosition = useSceneStore((s) => s.scrollPosition)

  if (sceneState !== 'browsing' || tracks.length === 0) return null

  const centerIdx = Math.round(scrollPosition)
  const current = tracks[centerIdx]
  if (!current) return null

  return (
    <>
      {/* Title + artist — bottom-left */}
      <div className="absolute bottom-6 left-8 z-40 max-w-md pointer-events-none">
        <h1 className="text-[var(--color-text)] text-2xl font-bold leading-tight tracking-tight">
          {current.title_short}
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">
          {current.artist.name}
        </p>
      </div>

      {/* Counter — top-right */}
      <div className="absolute top-5 right-6 z-40 text-[var(--color-text-muted)] text-xs font-medium tracking-widest opacity-50 pointer-events-none">
        {centerIdx + 1} / {tracks.length}
      </div>

      {/* Scroll hint — bottom-right, fades once user scrolls */}
      <div
        className="absolute bottom-6 right-8 z-40 flex items-center gap-2 pointer-events-none transition-opacity duration-500"
        style={{ opacity: scrollPosition < 0.5 ? 0.5 : 0 }}
      >
        <span className="text-[var(--color-text-muted)] text-[10px] uppercase tracking-widest">
          scroll
        </span>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="animate-pulse">
          <path
            d="M4 6L8 2L12 6"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--color-text-muted)]"
          />
          <path
            d="M4 10L8 14L12 10"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--color-text-muted)]"
          />
        </svg>
      </div>
    </>
  )
}

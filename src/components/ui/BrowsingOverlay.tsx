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

      {/* Scroll affordance — bottom-right. A vertical line with a pellet
          drifting down on loop reads more like motion than the old
          chevrons. Fades once the user takes the cue. */}
      <div
        className="absolute bottom-8 right-10 z-40 flex flex-col items-center gap-2 pointer-events-none transition-opacity duration-700"
        style={{ opacity: scrollPosition < 0.5 ? 0.6 : 0 }}
      >
        <span className="text-white/55 text-[10px] uppercase tracking-[0.32em]">
          scroll
        </span>
        <div className="relative h-7 w-px bg-white/15 overflow-hidden rounded-full">
          <span className="scroll-pellet absolute left-1/2 -translate-x-1/2 size-1 -ml-[1.5px] rounded-full bg-white/85" />
        </div>
      </div>
    </>
  )
}

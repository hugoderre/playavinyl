import type { ReactElement } from 'react'
import { useSceneStore } from '../../stores/sceneStore'
import { useSearchStore } from '../../stores/searchStore'

// Centered tasteful message for two missing states: the very first load
// (tracks haven't arrived yet) and a search that returned nothing. Stays
// mounted but fades opacity so the canvas fade-in handoff is seamless.
export function BrowseStateMessage(): ReactElement | null {
  const sceneState = useSceneStore((s) => s.state)
  const tracks = useSceneStore((s) => s.tracks)
  const query = useSearchStore((s) => s.query)
  const isLoading = useSearchStore((s) => s.isLoading)

  const shouldShow = sceneState === 'browsing' && tracks.length === 0
  const isEmptyResult = query.trim().length > 0 && !isLoading

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
      style={{
        opacity: shouldShow ? 1 : 0,
        transition: 'opacity 480ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      aria-hidden={!shouldShow}
    >
      {isEmptyResult ? (
        <div className="text-center px-8">
          <p className="text-white/85 text-base font-medium tracking-tight">
            Aucun vinyle pour « {query} »
          </p>
          <p className="text-white/35 text-[12px] mt-2">
            Essayez un autre artiste, un autre titre.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <span className="size-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
          <p className="text-white/40 text-[11px] uppercase tracking-[0.3em]">
            {isLoading ? 'Recherche…' : 'Chargement du bac'}
          </p>
        </div>
      )}
    </div>
  )
}

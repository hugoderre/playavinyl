import { useState, useEffect } from 'react'
import type { ReactElement } from 'react'
import { useSceneStore } from '../../stores/sceneStore'
import type { DeezerTrack } from '../../types'

export function VinylHoverInfo(): ReactElement | null {
  const [hoveredTrack, setHoveredTrack] = useState<DeezerTrack | null>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const sceneState = useSceneStore((s) => s.state)

  useEffect(() => {
    const handleHover = (e: CustomEvent<{ track: DeezerTrack | null; x: number; y: number }>): void => {
      setHoveredTrack(e.detail.track)
      setPosition({ x: e.detail.x, y: e.detail.y })
    }

    window.addEventListener('vinyl-hover', handleHover as EventListener)
    return () => window.removeEventListener('vinyl-hover', handleHover as EventListener)
  }, [])

  if (sceneState !== 'browsing' || !hoveredTrack) return null

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ left: position.x + 16, top: position.y - 10 }}
    >
      <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-[var(--color-border)]">
        <p className="text-[var(--color-text)] text-sm font-medium leading-tight">
          {hoveredTrack.title_short}
        </p>
        <p className="text-[var(--color-text-muted)] text-xs mt-0.5">
          {hoveredTrack.artist.name}
        </p>
      </div>
    </div>
  )
}

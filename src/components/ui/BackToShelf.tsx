import type { ReactElement } from 'react'
import { useCallback, useEffect } from 'react'
import { useSceneStore } from '../../stores/sceneStore'
import { useAudio } from '../../hooks/useAudio'

// Global "back to the shelf" affordance, visible only while we're at the
// turntable. Top-left of the screen so it's where the user's eye naturally
// lands first, with enough weight that it actually reads as a button.
export function BackToShelf(): ReactElement | null {
  const sceneState = useSceneStore((s) => s.state)
  const clearSelection = useSceneStore((s) => s.clearSelection)
  const { stopPlayback } = useAudio()

  const handleBack = useCallback(() => {
    clearSelection()
    stopPlayback()
  }, [clearSelection, stopPlayback])

  // ESC anywhere in 'playing' returns to the shelf. Standard UX, free win.
  useEffect(() => {
    if (sceneState !== 'playing') return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleBack()
      }
    }
    window.addEventListener('keydown', onKey)
    return (): void => window.removeEventListener('keydown', onKey)
  }, [sceneState, handleBack])

  if (sceneState !== 'playing') return null

  return (
    <button
      onClick={handleBack}
      className="
        group absolute top-6 left-6 z-50 cursor-pointer
        flex items-center gap-2 h-11 pl-3 pr-5
        rounded-full
        bg-black/55 backdrop-blur-xl
        border border-white/[0.10] hover:border-white/30
        text-white/85 hover:text-white
        shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]
        transition-all
        animate-fade-in-soft
      "
      aria-label="Retour au bac à vinyles"
    >
      <span
        className="
          flex items-center justify-center size-7 rounded-full
          bg-white/[0.06] group-hover:bg-white/[0.12]
          transition-colors
        "
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[13px] font-medium tracking-tight">
        Retour au bac
      </span>
    </button>
  )
}

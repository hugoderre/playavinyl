import { useRef, useEffect, useCallback } from 'react'
import type { Group } from 'three'
import { useSceneStore } from '../stores/sceneStore'
import { usePlayerStore } from '../stores/playerStore'
import { useAudio } from './useAudio'

const ANIMATION_DURATION = 2500 // ms

export function useVinylAnimation(): {
  animatingRef: React.RefObject<Group | null>
} {
  const animatingRef = useRef<Group | null>(null)
  const startTimeRef = useRef<number | null>(null)

  const sceneState = useSceneStore((s) => s.state)
  const selectedVinylId = useSceneStore((s) => s.selectedVinylId)
  const tracks = useSceneStore((s) => s.tracks)
  const setState = useSceneStore((s) => s.setState)
  const { playPreview } = useAudio()
  const play = usePlayerStore((s) => s.play)

  const startAnimation = useCallback(() => {
    startTimeRef.current = Date.now()
  }, [])

  useEffect(() => {
    if (sceneState !== 'animating' || !selectedVinylId) return

    const track = tracks.find((t) => t.id === selectedVinylId)
    if (!track) return

    startAnimation()

    const timer = setTimeout(() => {
      setState('playing')
      play(track)
      playPreview(track.preview)
    }, ANIMATION_DURATION)

    return () => clearTimeout(timer)
  }, [sceneState, selectedVinylId, tracks, startAnimation, setState, play, playPreview])

  return { animatingRef }
}

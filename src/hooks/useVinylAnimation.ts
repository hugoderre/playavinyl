import { useEffect } from 'react'
import { useSceneStore } from '../stores/sceneStore'
import { usePlayerStore } from '../stores/playerStore'
import { useAudio } from './useAudio'

const DEFAULT_DURATION = 2500

export function useVinylAnimation(durationMs: number = DEFAULT_DURATION): void {
  const sceneState = useSceneStore((s) => s.state)
  const selectedVinylId = useSceneStore((s) => s.selectedVinylId)
  const tracks = useSceneStore((s) => s.tracks)
  const setState = useSceneStore((s) => s.setState)
  const { playPreview } = useAudio()
  const play = usePlayerStore((s) => s.play)

  useEffect(() => {
    if (sceneState !== 'animating' || !selectedVinylId) return

    const track = tracks.find((t) => t.id === selectedVinylId)
    if (!track) return

    const timer = setTimeout(() => {
      setState('playing')
      play(track)
      playPreview(track.preview)
    }, durationMs)

    return () => clearTimeout(timer)
  }, [sceneState, selectedVinylId, tracks, setState, play, playPreview, durationMs])
}

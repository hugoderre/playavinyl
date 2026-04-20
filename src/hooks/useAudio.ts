import { useCallback } from 'react'
import { usePlayerStore } from '../stores/playerStore'
import { useSceneStore } from '../stores/sceneStore'

// Module-level singleton — all useAudio() calls share the same audio
let sharedAudio: HTMLAudioElement | null = null
let sharedAnimFrame = 0

export function useAudio(): {
  playPreview: (previewUrl: string) => void
  stopPlayback: () => void
} {
  const setProgress = usePlayerStore((s) => s.setProgress)
  const stop = usePlayerStore((s) => s.stop)
  const sceneSetState = useSceneStore((s) => s.setState)

  const stopPlayback = useCallback(() => {
    if (sharedAudio) {
      sharedAudio.pause()
      sharedAudio.currentTime = 0
    }
    cancelAnimationFrame(sharedAnimFrame)
    stop()
  }, [stop])

  const playPreview = useCallback((previewUrl: string) => {
    stopPlayback()

    const audio = new Audio(previewUrl)
    sharedAudio = audio

    const tick = (): void => {
      if (!sharedAudio || sharedAudio.paused) return
      setProgress(sharedAudio.currentTime)
      sharedAnimFrame = requestAnimationFrame(tick)
    }

    audio.addEventListener('ended', () => {
      cancelAnimationFrame(sharedAnimFrame)
      stop()
      sceneSetState('playing') // Stay on turntable view, just stopped
    })

    audio.play()
    sharedAnimFrame = requestAnimationFrame(tick)
  }, [stopPlayback, stop, setProgress, sceneSetState])

  return { playPreview, stopPlayback }
}

import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '../stores/playerStore'
import { useSceneStore } from '../stores/sceneStore'

export function useAudio(): {
  playPreview: (previewUrl: string) => void
  stopPlayback: () => void
} {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animFrameRef = useRef<number>(0)
  const setProgress = usePlayerStore((s) => s.setProgress)
  const stop = usePlayerStore((s) => s.stop)
  const sceneSetState = useSceneStore((s) => s.setState)

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    cancelAnimationFrame(animFrameRef.current)
    stop()
  }, [stop])

  const playPreview = useCallback((previewUrl: string) => {
    stopPlayback()

    const audio = new Audio(previewUrl)
    audioRef.current = audio

    const tick = (): void => {
      if (!audioRef.current || audioRef.current.paused) return
      setProgress(audioRef.current.currentTime)
      animFrameRef.current = requestAnimationFrame(tick)
    }

    audio.addEventListener('ended', () => {
      cancelAnimationFrame(animFrameRef.current)
      stop()
      sceneSetState('playing') // Stay on turntable view, just stopped
    })

    audio.play()
    animFrameRef.current = requestAnimationFrame(tick)
  }, [stopPlayback, stop, setProgress, sceneSetState])

  useEffect(() => {
    return () => {
      stopPlayback()
    }
  }, [stopPlayback])

  return { playPreview, stopPlayback }
}

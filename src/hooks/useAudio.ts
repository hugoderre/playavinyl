import { useCallback } from 'react'
import { usePlayerStore } from '../stores/playerStore'

// Module-level singleton so all useAudio() calls share the same audio element.
let sharedAudio: HTMLAudioElement | null = null
let sharedAnimFrame = 0

function clearSharedAudio(): void {
  if (sharedAudio) {
    sharedAudio.pause()
    sharedAudio.currentTime = 0
    sharedAudio = null
  }
  cancelAnimationFrame(sharedAnimFrame)
}

export function useAudio(): {
  playPreview: (previewUrl: string) => void
  resumePlayback: () => void
  stopPlayback: () => void
} {
  const setProgress = usePlayerStore((s) => s.setProgress)
  const setPlaying = usePlayerStore((s) => s.setPlaying)
  const stop = usePlayerStore((s) => s.stop)
  const setAutoplayBlocked = usePlayerStore((s) => s.setAutoplayBlocked)

  const stopPlayback = useCallback(() => {
    clearSharedAudio()
    stop()
    setAutoplayBlocked(false)
  }, [stop, setAutoplayBlocked])

  const startTicking = useCallback(() => {
    const tick = (): void => {
      if (!sharedAudio || sharedAudio.paused) return
      setProgress(sharedAudio.currentTime)
      sharedAnimFrame = requestAnimationFrame(tick)
    }
    sharedAnimFrame = requestAnimationFrame(tick)
  }, [setProgress])

  const playPreview = useCallback(
    (previewUrl: string) => {
      // Tear down any previous audio without touching player-store state yet,
      // so the optimistic "now playing" UI doesn't flicker through stop.
      clearSharedAudio()

      const audio = new Audio(previewUrl)
      sharedAudio = audio

      audio.addEventListener('ended', () => {
        cancelAnimationFrame(sharedAnimFrame)
        stop()
      })

      audio.addEventListener('error', () => {
        cancelAnimationFrame(sharedAnimFrame)
        sharedAudio = null
        stop()
      })

      audio
        .play()
        .then(() => {
          setPlaying(true)
          setAutoplayBlocked(false)
          startTicking()
        })
        .catch(() => {
          // Browser blocked autoplay (no user gesture). Surface a tap-to-play.
          setPlaying(false)
          setAutoplayBlocked(true)
        })
    },
    [setPlaying, setAutoplayBlocked, startTicking, stop],
  )

  // Called when the user explicitly taps after autoplay was blocked.
  const resumePlayback = useCallback(() => {
    if (!sharedAudio) return
    sharedAudio
      .play()
      .then(() => {
        setPlaying(true)
        setAutoplayBlocked(false)
        startTicking()
      })
      .catch(() => {
        setAutoplayBlocked(true)
      })
  }, [setPlaying, setAutoplayBlocked, startTicking])

  return { playPreview, resumePlayback, stopPlayback }
}

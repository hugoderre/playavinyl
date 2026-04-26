import { useEffect } from 'react'
import { usePlayerStore } from '../stores/playerStore'
import { useSceneStore } from '../stores/sceneStore'

const DEFAULT_TITLE = 'playavinyl'

// Mirrors the currently playing track in the browser tab title — small touch
// that makes the app feel like a real player when you're tab-switching.
export function useDocumentTitle(): void {
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const sceneState = useSceneStore((s) => s.state)

  useEffect(() => {
    if (sceneState === 'playing' && currentTrack) {
      document.title = `${currentTrack.title_short} — ${currentTrack.artist.name} · ${DEFAULT_TITLE}`
    } else {
      document.title = DEFAULT_TITLE
    }
    return (): void => {
      document.title = DEFAULT_TITLE
    }
  }, [currentTrack, sceneState])
}

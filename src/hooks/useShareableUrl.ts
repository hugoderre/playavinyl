import { useEffect, useRef, useMemo } from 'react'
import { useSceneStore } from '../stores/sceneStore'
import { getTrack, getChartTracks } from '../api/deezer'

export function useShareableUrl(): void {
  const setTracks = useSceneStore((s) => s.setTracks)
  const selectedVinylId = useSceneStore((s) => s.selectedVinylId)
  const sceneState = useSceneStore((s) => s.state)

  // Vrai seulement une fois qu'on a traversé au moins un cycle animating → browsing
  // dans cette session. Évite d'effacer ?t= dès le premier rendu.
  const hasAnimatedRef = useRef(false)

  const sharedTrackId = useMemo(() => {
    const raw = new URLSearchParams(window.location.search).get('t')
    const id = raw ? parseInt(raw, 10) : NaN
    return isNaN(id) ? null : id
  }, [])

  // Charger le track partagé en tête de bac + les charts derrière pour un bac complet
  useEffect(() => {
    if (sharedTrackId === null) return

    Promise.all([getTrack(sharedTrackId), getChartTracks()]).then(([track, charts]) => {
      const others = charts.filter((t) => t.id !== sharedTrackId)
      const tracks = track ? [track, ...others] : others
      if (tracks.length > 0) setTracks(tracks, 'charts')
    })
  }, [sharedTrackId, setTracks])

  // Mettre à jour l'URL quand un vinyle part en vol
  useEffect(() => {
    if (selectedVinylId !== null && sceneState === 'animating') {
      hasAnimatedRef.current = true
      const url = new URL(window.location.href)
      url.searchParams.set('t', String(selectedVinylId))
      history.pushState({}, '', url.toString())
    } else if (sceneState === 'browsing' && selectedVinylId === null && hasAnimatedRef.current) {
      // Nettoyer l'URL seulement après un vrai cycle de lecture dans cette session
      hasAnimatedRef.current = false
      const url = new URL(window.location.href)
      if (url.searchParams.has('t')) {
        url.searchParams.delete('t')
        history.pushState({}, '', url.toString())
      }
    }
  }, [selectedVinylId, sceneState])
}

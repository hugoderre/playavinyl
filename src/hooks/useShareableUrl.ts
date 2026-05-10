import { useEffect, useMemo } from 'react'
import { useSceneStore } from '../stores/sceneStore'
import { getTrack } from '../api/deezer'

export function useShareableUrl(): void {
  const setTracks = useSceneStore((s) => s.setTracks)
  const selectedVinylId = useSceneStore((s) => s.selectedVinylId)
  const sceneState = useSceneStore((s) => s.state)

  // Lire le param ?t= une seule fois au montage
  const sharedTrackId = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('t')
    const id = raw ? parseInt(raw, 10) : NaN
    return isNaN(id) ? null : id
  }, [])

  // Charger le track partagé — le bac affiche ce seul disque, l'utilisateur clique pour jouer
  useEffect(() => {
    if (sharedTrackId === null) return
    getTrack(sharedTrackId).then((track) => {
      if (track) setTracks([track], 'charts')
    })
  }, [sharedTrackId, setTracks])

  // Mettre à jour l'URL quand un vinyle est sélectionné
  useEffect(() => {
    if (selectedVinylId !== null && sceneState === 'animating') {
      const url = new URL(window.location.href)
      url.searchParams.set('t', String(selectedVinylId))
      history.pushState({}, '', url.toString())
    } else if (sceneState === 'browsing' && selectedVinylId === null) {
      const url = new URL(window.location.href)
      if (url.searchParams.has('t')) {
        url.searchParams.delete('t')
        history.pushState({}, '', url.toString())
      }
    }
  }, [selectedVinylId, sceneState])
}

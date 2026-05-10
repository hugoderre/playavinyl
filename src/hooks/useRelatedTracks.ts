import { useEffect } from 'react'
import { useSceneStore } from '../stores/sceneStore'
import { getArtistRadio } from '../api/deezer'

export function useRelatedTracks(): void {
  const selectedVinylId = useSceneStore((s) => s.selectedVinylId)
  const tracks = useSceneStore((s) => s.tracks)
  const storeRelatedTracks = useSceneStore((s) => s.storeRelatedTracks)

  useEffect(() => {
    if (selectedVinylId === null) return
    const track = tracks.find((t) => t.id === selectedVinylId)
    if (!track) return

    // Fetch silencieux pendant que l'animation joue — prêt quand l'utilisateur revient
    getArtistRadio(track.artist.id).then((related) => {
      // Exclure le track en cours pour ne pas le re-proposer en premier
      const filtered = related.filter((t) => t.id !== selectedVinylId)
      if (filtered.length > 0) storeRelatedTracks(filtered)
    }).catch(() => { /* silencieux */ })
  }, [selectedVinylId, tracks, storeRelatedTracks])
}

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
    const artistName = track.artist.name
    getArtistRadio(track.artist.id).then((related) => {
      const filtered = related.filter((t) => t.id !== selectedVinylId)
      if (filtered.length > 0) storeRelatedTracks(filtered, artistName)
    }).catch(() => { /* silencieux */ })
  }, [selectedVinylId, tracks, storeRelatedTracks])
}

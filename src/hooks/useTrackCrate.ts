import { useEffect } from 'react'
import { useSceneStore } from '../stores/sceneStore'
import { useCrateStore } from '../stores/crateStore'

export function useTrackCrate(): void {
  const selectedVinylId = useSceneStore((s) => s.selectedVinylId)
  const tracks = useSceneStore((s) => s.tracks)
  const addTrack = useCrateStore((s) => s.addTrack)

  useEffect(() => {
    if (selectedVinylId === null) return
    const track = tracks.find((t) => t.id === selectedVinylId)
    if (track) addTrack(track)
  }, [selectedVinylId, tracks, addTrack])
}

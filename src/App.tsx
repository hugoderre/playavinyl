import type { ReactElement } from 'react'
import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback } from 'react'
import { SceneLighting } from './components/scene/SceneLighting'
import { VinylShelf } from './components/scene/VinylShelf'
import { Turntable } from './components/scene/Turntable'
import { SceneManager } from './components/scene/SceneManager'
import { FlyingVinyl } from './components/scene/FlyingVinyl'
import { useSceneStore } from './stores/sceneStore'
import { useChartTracks } from './hooks/useDeezer'
import { SearchBar } from './components/ui/SearchBar'
import { TrackInfoPanel } from './components/ui/TrackInfoPanel'
import { VinylHoverInfo } from './components/ui/VinylHoverInfo'
import { BrowsingOverlay } from './components/ui/BrowsingOverlay'
import { useVinylAnimation } from './hooks/useVinylAnimation'
import { useAudio } from './hooks/useAudio'

const ANIMATION_DURATION_MS = 4000

export default function App(): ReactElement {
  const setTracks = useSceneStore((s) => s.setTracks)
  const sceneState = useSceneStore((s) => s.state)
  const selectedVinylId = useSceneStore((s) => s.selectedVinylId)
  const tracks = useSceneStore((s) => s.tracks)
  const animStart = useSceneStore((s) => s.animationStartedAt)

  const handleChartTracks = useCallback((tracks: Parameters<typeof setTracks>[0]) => {
    setTracks(tracks)
  }, [setTracks])

  useChartTracks(handleChartTracks)
  useVinylAnimation(ANIMATION_DURATION_MS)
  const { stopPlayback } = useAudio()

  const flyingTrack = tracks.find((t) => t.id === selectedVinylId) ?? null

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Canvas
        camera={{ position: [0, 0.3, 1.5], fov: 50 }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0a0a0a')
        }}
      >
        <SceneManager />
        <SceneLighting />
        <Suspense fallback={null}>
          <VinylShelf />
        </Suspense>
        {sceneState === 'animating' && flyingTrack && animStart > 0 && (
          <Suspense fallback={null}>
            <FlyingVinyl
              track={flyingTrack}
              startTime={animStart}
              durationMs={ANIMATION_DURATION_MS}
              onComplete={() => {
                /* transition handled by useVinylAnimation's timer */
              }}
            />
          </Suspense>
        )}
        <Turntable />
      </Canvas>

      <SearchBar />
      <BrowsingOverlay />
      <TrackInfoPanel stopPlayback={stopPlayback} />
      <VinylHoverInfo />
    </div>
  )
}

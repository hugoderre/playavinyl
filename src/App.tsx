import type { ReactElement } from 'react'
import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback } from 'react'
import { SceneLighting } from './components/scene/SceneLighting'
import { VinylShelf } from './components/scene/VinylShelf'
import { Turntable } from './components/scene/Turntable'
import { SceneManager } from './components/scene/SceneManager'
import { FlyingVinyl } from './components/scene/FlyingVinyl'
import { DustParticles } from './components/scene/DustParticles'
import { useSceneStore } from './stores/sceneStore'
import { useChartTracks } from './hooks/useDeezer'
import { SearchBar } from './components/ui/SearchBar'
import { TrackInfoPanel } from './components/ui/TrackInfoPanel'
import { VinylHoverInfo } from './components/ui/VinylHoverInfo'
import { BrowsingOverlay } from './components/ui/BrowsingOverlay'
import { BackToShelf } from './components/ui/BackToShelf'
import { useVinylAnimation } from './hooks/useVinylAnimation'

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

  const flyingTrack = tracks.find((t) => t.id === selectedVinylId) ?? null

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Canvas
        camera={{ position: [0, 0.3, 1.5], fov: 50 }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#070605')
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
        {/* Dust motes in the turntable spotlight — tight volume, subtle */}
        <DustParticles
          center={[8, 0.85, 0.4]}
          radius={0.45}
          count={18}
          color="#fff0d8"
          size={0.028}
          opacity={0.25}
        />
        {/* Dust around the hero record — atmosphere, not decoration */}
        <DustParticles
          center={[0, 0.1, 0.35]}
          radius={0.55}
          count={22}
          color="#fff0d8"
          size={0.022}
          opacity={0.18}
        />
      </Canvas>

      {/* Soft vignette — pulls the eye toward center without a hard frame */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <SearchBar />
      <BrowsingOverlay />
      <BackToShelf />
      <TrackInfoPanel />
      <VinylHoverInfo />
    </div>
  )
}

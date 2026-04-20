import type { ReactElement } from 'react'
import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback } from 'react'
import { SceneLighting } from './components/scene/SceneLighting'
import { VinylShelf } from './components/scene/VinylShelf'
import { Turntable } from './components/scene/Turntable'
import { SceneManager } from './components/scene/SceneManager'
import { useSceneStore } from './stores/sceneStore'
import { useChartTracks } from './hooks/useDeezer'
import { SearchBar } from './components/ui/SearchBar'
import { TrackInfoPanel } from './components/ui/TrackInfoPanel'
import { VinylHoverInfo } from './components/ui/VinylHoverInfo'
import { BrowsingOverlay } from './components/ui/BrowsingOverlay'
import { useVinylAnimation } from './hooks/useVinylAnimation'
import { useAudio } from './hooks/useAudio'

export default function App(): ReactElement {
  const setTracks = useSceneStore((s) => s.setTracks)

  const handleChartTracks = useCallback((tracks: Parameters<typeof setTracks>[0]) => {
    setTracks(tracks)
  }, [setTracks])

  useChartTracks(handleChartTracks)
  useVinylAnimation()
  const { stopPlayback } = useAudio()

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* 3D Scene */}
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
        <Turntable />
      </Canvas>

      {/* UI Overlays */}
      <SearchBar />
      <BrowsingOverlay />
      <TrackInfoPanel stopPlayback={stopPlayback} />
      <VinylHoverInfo />
    </div>
  )
}

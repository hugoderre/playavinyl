import type { ReactElement } from 'react'
import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback } from 'react'
import { SceneLighting } from './components/scene/SceneLighting'
import { VinylShelf } from './components/scene/VinylShelf'
import { Turntable } from './components/scene/Turntable'
import { SceneManager } from './components/scene/SceneManager'
import { useSceneStore } from './stores/sceneStore'
import { useChartTracks } from './hooks/useDeezer'

export default function App(): ReactElement {
  const setTracks = useSceneStore((s) => s.setTracks)

  const handleChartTracks = useCallback((tracks: Parameters<typeof setTracks>[0]) => {
    setTracks(tracks)
  }, [setTracks])

  useChartTracks(handleChartTracks)

  return (
    <div className="relative w-full h-full">
      {/* 3D Scene */}
      <Canvas
        camera={{ position: [0, 0.3, 1.5], fov: 50 }}
        className="absolute inset-0"
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

      {/* UI Overlays will be added in Tasks 13-15 */}
    </div>
  )
}

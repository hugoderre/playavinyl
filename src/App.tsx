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
import { useChartTracks, useFetchMoreTracks } from './hooks/useDeezer'
import { SearchBar } from './components/ui/SearchBar'
import { TrackInfoPanel } from './components/ui/TrackInfoPanel'
import { VinylHoverInfo } from './components/ui/VinylHoverInfo'
import { BrowsingOverlay } from './components/ui/BrowsingOverlay'
import { BackToShelf } from './components/ui/BackToShelf'
import { BrowseStateMessage } from './components/ui/BrowseStateMessage'
import { useVinylAnimation } from './hooks/useVinylAnimation'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import { useTrackCrate } from './hooks/useTrackCrate'
import { useShareableUrl } from './hooks/useShareableUrl'
import { useRelatedTracks } from './hooks/useRelatedTracks'
import { GenreSelector } from './components/ui/GenreSelector'

const ANIMATION_DURATION_MS = 4000

export default function App(): ReactElement {
  const setTracks = useSceneStore((s) => s.setTracks)
  const setLoadError = useSceneStore((s) => s.setLoadError)
  const sceneState = useSceneStore((s) => s.state)
  const selectedVinylId = useSceneStore((s) => s.selectedVinylId)
  const tracks = useSceneStore((s) => s.tracks)
  const animStart = useSceneStore((s) => s.animationStartedAt)
  // The 3D canvas fades in once tracks arrive — avoids the harsh "pop" when
  // covers suddenly materialize after the Deezer fetch resolves.
  const canvasReady = tracks.length > 0

  const handleChartTracks = useCallback((tracks: Parameters<typeof setTracks>[0]) => {
    setTracks(tracks, 'charts')
  }, [setTracks])

  const handleChartError = useCallback(() => setLoadError(true), [setLoadError])

  // Si l'URL contient ?t=, useShareableUrl charge ce track — on laisse les charts de côté
  const hasSharedTrack = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('t')
  useChartTracks(handleChartTracks, handleChartError, hasSharedTrack)
  useFetchMoreTracks()
  useVinylAnimation(ANIMATION_DURATION_MS)
  useDocumentTitle()
  useTrackCrate()
  useShareableUrl()
  useRelatedTracks()

  const isMobile = window.innerWidth < 768

  const flyingTrack = tracks.find((t) => t.id === selectedVinylId) ?? null

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Canvas
        camera={{ position: [0, 0.3, 1.5], fov: 50 }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: canvasReady ? 1 : 0,
          transition: 'opacity 720ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
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
          count={isMobile ? 40 : 18}
          color="#fff0d8"
          size={isMobile ? 0.04 : 0.028}
          opacity={isMobile ? 0.35 : 0.25}
        />
        {/* Dust around the hero record — atmosphere, not decoration */}
        <DustParticles
          center={[0, 0.1, 0.35]}
          radius={0.55}
          count={isMobile ? 50 : 22}
          color="#fff0d8"
          size={isMobile ? 0.032 : 0.022}
          opacity={isMobile ? 0.28 : 0.18}
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
      <GenreSelector />
      <BrowsingOverlay />
      <BrowseStateMessage />
      <BackToShelf />
      <TrackInfoPanel />
      <VinylHoverInfo />
    </div>
  )
}

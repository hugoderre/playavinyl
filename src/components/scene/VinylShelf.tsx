import { useEffect, useMemo, Suspense } from 'react'
import type { ReactElement } from 'react'
import { useThree } from '@react-three/fiber'
import { Vector3, Quaternion } from 'three'
import { VinylRecord } from './VinylRecord'
import { useSceneStore } from '../../stores/sceneStore'
import { useDominantColor, rgbToHex } from '../../hooks/useDominantColor'
import type { DeezerTrack } from '../../types'

const VISIBLE_COUNT = 24

// Diagonal trajectory in world space — matches MOCK-VINYL-FLOW.html
// Near vinyl sits foreground-left-low, far one recedes back-up-right.
const NEAR_POINT = new Vector3(-0.8, 0.0, 0.9)
const FAR_POINT = new Vector3(2.2, 0.9, -2.8)

const SCALE_NEAR = 1.0
const SCALE_FAR = 0.14
const VINYL_TILT_X = -0.04 // nearly face-on (subtle lean)

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function VinylShelf(): ReactElement | null {
  const tracks = useSceneStore((s) => s.tracks)
  const scrollPosition = useSceneStore((s) => s.scrollPosition)
  const setScrollPosition = useSceneStore((s) => s.setScrollPosition)
  const selectVinyl = useSceneStore((s) => s.selectVinyl)
  const selectedVinylId = useSceneStore((s) => s.selectedVinylId)
  const sceneState = useSceneStore((s) => s.state)
  const { gl } = useThree()

  useEffect(() => {
    if (sceneState !== 'browsing') return

    const canvas = gl.domElement
    const handleWheel = (e: WheelEvent): void => {
      e.preventDefault()
      const delta = e.deltaY * 0.003
      const maxScroll = Math.max(0, tracks.length - 1)
      setScrollPosition(Math.max(0, Math.min(maxScroll, scrollPosition + delta)))
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [gl, scrollPosition, setScrollPosition, tracks.length, sceneState])

  const handleVinylClick = (track: DeezerTrack): void => {
    if (sceneState === 'browsing') {
      selectVinyl(track.id)
    }
  }

  if (sceneState === 'playing') return null

  const baseIdx = Math.floor(scrollPosition)
  const startIdx = Math.max(0, baseIdx - 1)
  const endIdx = Math.min(tracks.length, startIdx + VISIBLE_COUNT + 1)
  const visibleTracks = tracks.slice(startIdx, endIdx)
  const frac = scrollPosition - Math.floor(scrollPosition)

  const centerIdx = Math.round(scrollPosition)
  const featuredTrack = tracks[centerIdx]

  return (
    <group>
      <DiagonalShelf />
      {featuredTrack && <FeaturedGlow track={featuredTrack} />}

      <Suspense fallback={null}>
        {visibleTracks.map((track, i) => {
          // Hide the vinyl that's currently flying to the turntable
          if (sceneState === 'animating' && track.id === selectedVinylId) return null

          const globalIdx = startIdx + i
          const depth = globalIdx - baseIdx - frac
          if (depth < -1 || depth > VISIBLE_COUNT) return null

          const t = Math.max(0, Math.min(1, depth / (VISIBLE_COUNT - 1)))

          const x = lerp(NEAR_POINT.x, FAR_POINT.x, t)
          const y = lerp(NEAR_POINT.y, FAR_POINT.y, t)
          const z = lerp(NEAR_POINT.z, FAR_POINT.z, t)
          const scale = lerp(SCALE_NEAR, SCALE_FAR, t)

          const opacity = depth < 0 ? Math.max(0, 1 + depth) : 1
          const finalScale = opacity > 0.05 ? scale * opacity : 0

          return (
            <VinylRecord
              key={track.id}
              track={track}
              position={[x, y, z]}
              rotation={[VINYL_TILT_X, 0, 0]}
              scale={finalScale}
              onClick={() => handleVinylClick(track)}
            />
          )
        })}
      </Suspense>
    </group>
  )
}

// Colored point-light that follows the featured (front-most) vinyl,
// tinting the scene with the dominant color of its cover art.
function FeaturedGlow({ track }: { track: DeezerTrack }): ReactElement | null {
  const color = useDominantColor(track.album.cover_medium)
  if (!color) return null
  const hex = rgbToHex(color)
  return (
    <>
      {/* Big colored halo behind the featured vinyl — primary atmospheric glow */}
      <pointLight
        position={[NEAR_POINT.x + 0.15, NEAR_POINT.y + 0.25, NEAR_POINT.z - 0.5]}
        intensity={12}
        color={hex}
        distance={3.5}
        decay={1.6}
      />
      {/* Closer pop to lift the featured cover */}
      <pointLight
        position={[NEAR_POINT.x - 0.1, NEAR_POINT.y + 0.1, NEAR_POINT.z + 0.15]}
        intensity={3.5}
        color={hex}
        distance={1.6}
        decay={2}
      />
      {/* Rim light from below — warm edge underneath */}
      <pointLight
        position={[NEAR_POINT.x - 0.05, NEAR_POINT.y - 0.3, NEAR_POINT.z - 0.05]}
        intensity={2.2}
        color={hex}
        distance={1.3}
        decay={2}
      />
    </>
  )
}

// Wooden crate aligned with the NEAR→FAR diagonal.
// The whole structure is rotated via a quaternion so local +Z runs along
// the diagonal. Once rotated, LOCAL axes map to world as follows (given
// our specific direction):
//   local +X world ≈ (-0.62, -0.48, -0.62) → deeper into scene (away from camera)
//   local +Y world ≈ (-0.48,  0.85, -0.19) → mostly up (with a lean back)
//   local +Z world ≈ ( 0.62,  0.19, -0.76) → along the diagonal
// So: back wall goes at local +X (behind vinyls), floor below at local -Y,
// front rim at local -X (foreground side).
function DiagonalShelf(): ReactElement {
  const { position, quaternion, length } = useMemo(() => {
    const dir = new Vector3().subVectors(FAR_POINT, NEAR_POINT)
    const len = dir.length()
    const mid = new Vector3().addVectors(NEAR_POINT, FAR_POINT).multiplyScalar(0.5)
    const q = new Quaternion().setFromUnitVectors(
      new Vector3(0, 0, 1),
      dir.clone().normalize(),
    )
    return { position: mid, quaternion: q, length: len }
  }, [])

  const qt: [number, number, number, number] = [
    quaternion.x,
    quaternion.y,
    quaternion.z,
    quaternion.w,
  ]

  const extra = 0.15 // minimal overhang past NEAR/FAR
  const totalLen = length + extra

  return (
    <group position={position} quaternion={qt}>
      {/* Floor plank — same width as a sleeve, just enough to "hold" the vinyls */}
      <mesh position={[0, -0.19, 0]}>
        <boxGeometry args={[0.33, 0.018, totalLen]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Back panel — taller, behind vinyls from camera's view */}
      <mesh position={[0.16, 0.0, 0]}>
        <boxGeometry args={[0.012, 0.38, totalLen]} />
        <meshStandardMaterial color="#3d2510" roughness={0.9} metalness={0.02} />
      </mesh>

      {/* Low front rim — kept short so it doesn't occlude the vinyl covers */}
      <mesh position={[-0.16, -0.17, 0]}>
        <boxGeometry args={[0.012, 0.04, totalLen]} />
        <meshStandardMaterial color="#6b4423" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Warm LED strip tucked behind the back panel */}
      <mesh position={[0.155, -0.17, 0]}>
        <boxGeometry args={[0.006, 0.006, totalLen * 0.96]} />
        <meshStandardMaterial
          color="#ffb066"
          emissive="#ffb066"
          emissiveIntensity={2.2}
          roughness={0.5}
        />
      </mesh>
    </group>
  )
}

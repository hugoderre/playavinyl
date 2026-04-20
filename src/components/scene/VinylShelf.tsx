import { useEffect, Suspense } from 'react'
import type { ReactElement } from 'react'
import { useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { VinylRecord } from './VinylRecord'
import { useSceneStore } from '../../stores/sceneStore'
import type { DeezerTrack } from '../../types'

const VISIBLE_COUNT = 18

// Diagonal trajectory: near-low-left → far-high-right
// The nearest vinyl sits in the foreground-center; as index increases
// each vinyl recedes up-and-to-the-right, matching MOCK-VINYL-FLOW.html.
// Diagonal goes from front-left-low to back-right-up (matches MOCK exactly)
const NEAR_POINT = new Vector3(-0.8, 0.0, 0.9)
const FAR_POINT = new Vector3(2.2, 0.9, -2.8)
const SCALE_NEAR = 1.0
const SCALE_FAR = 0.14

// Vinyls stand with a slight back-tilt so covers face the camera
const VINYL_TILT_X = -0.15

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function VinylShelf(): ReactElement | null {
  const tracks = useSceneStore((s) => s.tracks)
  const scrollPosition = useSceneStore((s) => s.scrollPosition)
  const setScrollPosition = useSceneStore((s) => s.setScrollPosition)
  const selectVinyl = useSceneStore((s) => s.selectVinyl)
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

  // Render a window of vinyls starting at floor(scrollPosition) - 1
  const baseIdx = Math.floor(scrollPosition)
  const startIdx = Math.max(0, baseIdx - 1)
  const endIdx = Math.min(tracks.length, startIdx + VISIBLE_COUNT + 1)
  const visibleTracks = tracks.slice(startIdx, endIdx)
  const frac = scrollPosition - Math.floor(scrollPosition)

  return (
    <group>
      {/* Wooden rail running along the diagonal path — suggests a display shelf */}
      <DiagonalRail />

      {/* Vinyls positioned along the diagonal */}
      <Suspense fallback={null}>
        {visibleTracks.map((track, i) => {
          const globalIdx = startIdx + i
          // depth: how far this vinyl is from the camera-front vinyl (0 = featured)
          const depth = (globalIdx - baseIdx) - frac
          if (depth < -1 || depth > VISIBLE_COUNT) return null

          const t = Math.max(0, Math.min(1, depth / (VISIBLE_COUNT - 1)))
          const e = easeOut(t)

          const x = lerp(NEAR_POINT.x, FAR_POINT.x, e)
          const y = lerp(NEAR_POINT.y, FAR_POINT.y, e)
          const z = lerp(NEAR_POINT.z, FAR_POINT.z, e)
          const scale = lerp(SCALE_NEAR, SCALE_FAR, e)

          // Front-most vinyl fades in from left (when depth goes negative)
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

// A thin wooden rail following the NEAR→FAR diagonal, hints at a physical display
function DiagonalRail(): ReactElement {
  const dir = new Vector3().subVectors(FAR_POINT, NEAR_POINT)
  const length = dir.length()
  const mid = new Vector3().addVectors(NEAR_POINT, FAR_POINT).multiplyScalar(0.5)
  // Place rail slightly below the vinyls' base
  mid.y -= 0.17
  // Compute Y-axis rotation so the rail aligns with the X-Z projection of dir
  const angleY = Math.atan2(dir.x, -dir.z)
  // Angle around the rail's local X so it rises with dir.y
  const horizontalLen = Math.sqrt(dir.x * dir.x + dir.z * dir.z)
  const angleX = Math.atan2(dir.y, horizontalLen)

  return (
    <group position={mid} rotation={[angleX, angleY, 0]}>
      {/* Main rail plank */}
      <mesh>
        <boxGeometry args={[0.08, 0.015, length]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Back wall running parallel to the rail, behind the vinyls */}
      <mesh position={[0, 0.15, -0.2]}>
        <boxGeometry args={[0.01, 0.45, length]} />
        <meshStandardMaterial color="#3d2510" roughness={0.9} metalness={0.02} />
      </mesh>
    </group>
  )
}

import { useEffect, Suspense } from 'react'
import type { ReactElement } from 'react'
import { useThree } from '@react-three/fiber'
import { VinylRecord } from './VinylRecord'
import { useSceneStore } from '../../stores/sceneStore'
import type { DeezerTrack } from '../../types'

const VINYL_SLOT_SPACING = 0.07 // visible gap between covers
const VISIBLE_COUNT = 25

// Crate dimensions — long, shallow, open-top display stand
const CRATE_LENGTH = 12
const CRATE_DEPTH = 0.45
const CRATE_BACK_HEIGHT = 0.45 // tall back panel
const CRATE_FRONT_HEIGHT = 0.1 // low front rim (typical record crate)
const CRATE_THICKNESS = 0.018

// Vinyls tilted back so covers face camera
const VINYL_TILT_X = -0.25 // ~14° backward
const VINYL_BASE_Y = 0.02

// Featured vinyl (active, pulled out in front)
const FEATURED_SCALE = 1.6
const FEATURED_OFFSET_Z = 0.6
const FEATURED_OFFSET_Y = 0.08
const FEATURED_TILT_X = -0.1 // mostly upright

const WOOD_COLOR = '#6b4423'
const WOOD_DARK = '#3d2510'

export function VinylShelf(): ReactElement {
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
      const delta = e.deltaY * 0.004
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

  const centerIdx = Math.round(scrollPosition)
  const startIdx = Math.max(0, centerIdx - Math.floor(VISIBLE_COUNT / 2))
  const endIdx = Math.min(tracks.length, startIdx + VISIBLE_COUNT)
  const visibleTracks = tracks.slice(startIdx, endIdx)

  // Hide the shelf entirely when focused on the turntable
  if (sceneState === 'playing') return null

  return (
    <group position={[0, 0, 0]}>
      {/* Crate bottom */}
      <mesh position={[0, -CRATE_FRONT_HEIGHT - CRATE_THICKNESS / 2, 0]}>
        <boxGeometry args={[CRATE_LENGTH, CRATE_THICKNESS, CRATE_DEPTH]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.85} metalness={0.02} />
      </mesh>

      {/* Tall back wall */}
      <mesh
        position={[
          0,
          -CRATE_FRONT_HEIGHT + CRATE_BACK_HEIGHT / 2 - CRATE_THICKNESS / 2,
          -CRATE_DEPTH / 2 - CRATE_THICKNESS / 2,
        ]}
      >
        <boxGeometry args={[CRATE_LENGTH, CRATE_BACK_HEIGHT, CRATE_THICKNESS]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.9} metalness={0.02} />
      </mesh>

      {/* Low front rim */}
      <mesh
        position={[
          0,
          -CRATE_FRONT_HEIGHT + CRATE_FRONT_HEIGHT / 2 - CRATE_THICKNESS / 2,
          CRATE_DEPTH / 2 + CRATE_THICKNESS / 2,
        ]}
      >
        <boxGeometry args={[CRATE_LENGTH, CRATE_FRONT_HEIGHT, CRATE_THICKNESS]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.85} metalness={0.02} />
      </mesh>

      {/* Legs — four legs at corners of the visible portion */}
      {(
        [
          [-1.5, CRATE_DEPTH / 2 - 0.02],
          [1.5, CRATE_DEPTH / 2 - 0.02],
          [-1.5, -CRATE_DEPTH / 2 + 0.02],
          [1.5, -CRATE_DEPTH / 2 + 0.02],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, -CRATE_FRONT_HEIGHT - 0.14, z]}>
          <cylinderGeometry args={[0.016, 0.022, 0.26, 12]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.9} metalness={0.05} />
        </mesh>
      ))}

      {/* Vinyls */}
      <Suspense fallback={null}>
        {visibleTracks.map((track, i) => {
          const globalIdx = startIdx + i
          const offset = globalIdx - scrollPosition
          const isFeatured = globalIdx === centerIdx

          const inCrateX = offset * VINYL_SLOT_SPACING
          const inCrateY = VINYL_BASE_Y
          const inCrateZ = 0

          // Featured: centered in X, pulled forward, raised, less tilted
          const targetX = isFeatured ? 0 : inCrateX
          const targetY = isFeatured ? VINYL_BASE_Y + FEATURED_OFFSET_Y : inCrateY
          const targetZ = isFeatured ? FEATURED_OFFSET_Z : inCrateZ
          const targetTilt = isFeatured ? FEATURED_TILT_X : VINYL_TILT_X
          const targetScale = isFeatured ? FEATURED_SCALE : 1

          return (
            <VinylRecord
              key={track.id}
              track={track}
              position={[targetX, targetY, targetZ]}
              rotation={[targetTilt, 0, 0]}
              scale={targetScale}
              onClick={() => handleVinylClick(track)}
            />
          )
        })}
      </Suspense>
    </group>
  )
}

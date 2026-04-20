import { useRef, useCallback, useEffect, Suspense } from 'react'
import type { ReactElement } from 'react'
import { useThree } from '@react-three/fiber'
import type { Group } from 'three'
import { VinylRecord } from './VinylRecord'
import { useSceneStore } from '../../stores/sceneStore'
import type { DeezerTrack } from '../../types'

const SLEEVE_SIZE_APPROX = 0.31 // ~31cm vinyl sleeve
const VINYL_SPACING = 0.02 // gap between vinyls in the shelf
const VISIBLE_COUNT = 20

export function VinylShelf(): ReactElement {
  const groupRef = useRef<Group>(null)
  const tracks = useSceneStore((s) => s.tracks)
  const scrollPosition = useSceneStore((s) => s.scrollPosition)
  const setScrollPosition = useSceneStore((s) => s.setScrollPosition)
  const selectVinyl = useSceneStore((s) => s.selectVinyl)
  const sceneState = useSceneStore((s) => s.state)
  const { gl } = useThree()

  // Scroll handler
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

  const handleVinylClick = useCallback(
    (track: DeezerTrack) => {
      if (sceneState === 'browsing') {
        selectVinyl(track.id)
      }
    },
    [selectVinyl, sceneState],
  )

  // Calculate visible vinyls based on scroll position
  const startIdx = Math.max(0, Math.floor(scrollPosition) - 1)
  const endIdx = Math.min(tracks.length, startIdx + VISIBLE_COUNT)
  const visibleTracks = tracks.slice(startIdx, endIdx)

  return (
    <group ref={groupRef}>
      {/* Shelf furniture — simple box for now, will be refined */}
      {/* Bottom shelf board */}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[0.6, 0.02, 0.35]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Back board */}
      <mesh position={[0, 0, -0.17]}>
        <boxGeometry args={[0.6, 0.45, 0.01]} />
        <meshStandardMaterial color="#4a2e14" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Left side */}
      <mesh position={[-0.3, 0, 0]}>
        <boxGeometry args={[0.015, 0.45, 0.35]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Right side (extends further to suggest depth) */}
      <mesh position={[0.3, 0, 0]}>
        <boxGeometry args={[0.015, 0.45, 0.35]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Legs */}
      {(
        [
          [-0.28, -0.35, 0.14],
          [0.28, -0.35, 0.14],
          [-0.28, -0.35, -0.14],
          [0.28, -0.35, -0.14],
        ] as [number, number, number][]
      ).map((pos, i) => (
        <mesh key={i} position={pos}>
          <cylinderGeometry args={[0.01, 0.012, 0.12, 8]} />
          <meshStandardMaterial color="#3d2510" roughness={0.9} metalness={0.05} />
        </mesh>
      ))}

      {/* Vinyl records inside the shelf */}
      <Suspense fallback={null}>
        {visibleTracks.map((track, i) => {
          const globalIdx = startIdx + i
          const offset = globalIdx - scrollPosition

          // Position vinyls along Z axis (depth), tilted slightly
          const z = offset * (SLEEVE_SIZE_APPROX + VINYL_SPACING)
          const opacity = offset < 0 ? Math.max(0, 1 + offset) : 1

          return (
            <VinylRecord
              key={track.id}
              track={track}
              position={[0, 0, z * -1]}
              rotation={[0, 0, 0]}
              scale={opacity > 0.1 ? 1 : 0}
              onClick={() => handleVinylClick(track)}
            />
          )
        })}
      </Suspense>
    </group>
  )
}

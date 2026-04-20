import { useRef, Suspense } from 'react'
import type { ReactElement } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import type { Mesh, Group } from 'three'
import { TextureLoader } from 'three'
import { usePlayerStore } from '../../stores/playerStore'
import type { DeezerTrack } from '../../types'

const PLATTER_RADIUS = 0.15
const BASE_WIDTH = 0.45
const BASE_DEPTH = 0.35
const BASE_HEIGHT = 0.04
const RPM = 33.33
const RADIANS_PER_SECOND = (RPM / 60) * Math.PI * 2

interface VinylOnPlatterProps {
  track: DeezerTrack
}

function VinylOnPlatter({ track }: VinylOnPlatterProps): ReactElement {
  const discRef = useRef<Mesh>(null)
  const coverTexture = useLoader(TextureLoader, track.album.cover_medium)
  const isPlaying = usePlayerStore((s) => s.isPlaying)

  useFrame((_, delta) => {
    if (discRef.current && isPlaying) {
      discRef.current.rotation.y += RADIANS_PER_SECOND * delta
    }
  })

  return (
    <group ref={discRef} position={[0, 0.018, 0]}>
      {/* Disc body (black, lies flat on the platter) */}
      <mesh>
        <cylinderGeometry
          args={[PLATTER_RADIUS - 0.005, PLATTER_RADIUS - 0.005, 0.002, 64]}
        />
        <meshStandardMaterial color="#0a0a0a" roughness={0.35} metalness={0.7} />
      </mesh>
      {/* Colored center label from album cover (slightly above the disc) */}
      <mesh position={[0, 0.0015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.045, 32]} />
        <meshStandardMaterial map={coverTexture} roughness={0.55} metalness={0.1} />
      </mesh>
    </group>
  )
}

export function Turntable(): ReactElement {
  const platterRef = useRef<Mesh>(null)
  const tonearmRef = useRef<Group>(null)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTrack = usePlayerStore((s) => s.currentTrack)

  useFrame((_, delta) => {
    if (platterRef.current && isPlaying) {
      platterRef.current.rotation.y += RADIANS_PER_SECOND * delta
    }

    if (tonearmRef.current) {
      const targetRotation = isPlaying ? -0.15 : 0.3
      tonearmRef.current.rotation.y +=
        (targetRotation - tonearmRef.current.rotation.y) * 0.05
    }
  })

  return (
    <group position={[8, 0, 0]}>
      {/* Base / plinth */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[BASE_WIDTH, BASE_HEIGHT, BASE_DEPTH]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Platter */}
      <mesh ref={platterRef} position={[0, 0.01, 0]}>
        <cylinderGeometry args={[PLATTER_RADIUS, PLATTER_RADIUS, 0.008, 64]} />
        <meshStandardMaterial color="#222222" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Platter center spindle */}
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.02, 16]} />
        <meshStandardMaterial color="#888888" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Current vinyl on the platter */}
      {currentTrack && (
        <Suspense fallback={null}>
          <VinylOnPlatter track={currentTrack} />
        </Suspense>
      )}

      {/* Tonearm assembly */}
      <group ref={tonearmRef} position={[0.18, 0.025, -0.1]}>
        <mesh>
          <cylinderGeometry args={[0.012, 0.012, 0.02, 16]} />
          <meshStandardMaterial color="#333333" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[-0.1, 0.01, 0.08]} rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.005, 0.005, 0.2]} />
          <meshStandardMaterial color="#666666" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[-0.14, 0.008, 0.17]} rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.015, 0.008, 0.025]} />
          <meshStandardMaterial color="#444444" roughness={0.4} metalness={0.7} />
        </mesh>
      </group>

      {/* Power button indicator */}
      <mesh position={[0.18, 0.025, 0.14]}>
        <sphereGeometry args={[0.005, 16, 16]} />
        <meshStandardMaterial
          color={isPlaying ? '#e67e22' : '#333333'}
          emissive={isPlaying ? '#e67e22' : '#000000'}
          emissiveIntensity={isPlaying ? 0.5 : 0}
        />
      </mesh>
    </group>
  )
}

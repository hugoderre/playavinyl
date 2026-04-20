import { useRef } from 'react'
import type { ReactElement } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh, Group } from 'three'
import { usePlayerStore } from '../../stores/playerStore'

const PLATTER_RADIUS = 0.15
const BASE_WIDTH = 0.45
const BASE_DEPTH = 0.35
const BASE_HEIGHT = 0.04
const RPM = 33.33
const RADIANS_PER_SECOND = (RPM / 60) * Math.PI * 2

export function Turntable(): ReactElement {
  const platterRef = useRef<Mesh>(null)
  const tonearmRef = useRef<Group>(null)
  const isPlaying = usePlayerStore((s) => s.isPlaying)

  useFrame((_, delta) => {
    // Spin the platter when playing
    if (platterRef.current && isPlaying) {
      platterRef.current.rotation.y += RADIANS_PER_SECOND * delta
    }

    // Tonearm position
    if (tonearmRef.current) {
      const targetRotation = isPlaying ? -0.15 : 0.3
      tonearmRef.current.rotation.y += (targetRotation - tonearmRef.current.rotation.y) * 0.05
    }
  })

  return (
    <group position={[2, 0, 0]}>
      {/* Base / plinth */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[BASE_WIDTH, BASE_HEIGHT, BASE_DEPTH]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Platter */}
      <mesh ref={platterRef} position={[0, 0.01, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[PLATTER_RADIUS, PLATTER_RADIUS, 0.008, 64]} />
        <meshStandardMaterial color="#222222" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Platter center spindle */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.015, 16]} />
        <meshStandardMaterial color="#888888" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Tonearm assembly */}
      <group ref={tonearmRef} position={[0.18, 0.025, -0.1]}>
        {/* Pivot base */}
        <mesh>
          <cylinderGeometry args={[0.012, 0.012, 0.02, 16]} />
          <meshStandardMaterial color="#333333" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Arm */}
        <mesh position={[-0.1, 0.01, 0.08]} rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.005, 0.005, 0.2]} />
          <meshStandardMaterial color="#666666" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Headshell / cartridge */}
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

import { useRef, Suspense } from 'react'
import type { ReactElement } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import type { Mesh, Group, PointLight } from 'three'
import { TextureLoader } from 'three'
import { usePlayerStore } from '../../stores/playerStore'
import { useDominantColor, rgbToHex } from '../../hooks/useDominantColor'
import { useSceneStore } from '../../stores/sceneStore'
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
  const discRef = useRef<Group>(null)
  const coverTexture = useLoader(TextureLoader, track.album.cover_medium)
  const isPlaying = usePlayerStore((s) => s.isPlaying)

  useFrame((_, delta) => {
    if (discRef.current && isPlaying) {
      discRef.current.rotation.y += RADIANS_PER_SECOND * delta
    }
  })

  return (
    <group ref={discRef} position={[0, 0.018, 0]}>
      {/* Disc body — softer, less metallic so it actually reads against the bright platter */}
      <mesh>
        <cylinderGeometry
          args={[PLATTER_RADIUS - 0.005, PLATTER_RADIUS - 0.005, 0.002, 64]}
        />
        <meshStandardMaterial color="#0c0c0c" roughness={0.55} metalness={0.35} />
      </mesh>
      {/* Outer groove highlight ring */}
      <mesh position={[0, 0.0011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.13, 0.135, 64]} />
        <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Inner groove highlight ring */}
      <mesh position={[0, 0.0011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.095, 0.098, 64]} />
        <meshStandardMaterial color="#1f1f1f" roughness={0.35} metalness={0.55} />
      </mesh>
      {/* Center label — bigger than real life so the cover art is the hero */}
      <mesh position={[0, 0.0015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.085, 48]} />
        <meshStandardMaterial
          map={coverTexture}
          emissiveMap={coverTexture}
          emissive="#ffffff"
          emissiveIntensity={0.42}
          roughness={0.5}
          metalness={0.05}
        />
      </mesh>
      {/* Spindle hole — small dark circle at the dead center */}
      <mesh position={[0, 0.0017, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.004, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  )
}

// Atmospheric glow tinted by the playing track's dominant color — same
// language as the hero's atmosphere at the shelf, so the turntable feels
// like the same room.
function TurntableAtmosphere({ track }: { track: DeezerTrack }): ReactElement | null {
  const color = useDominantColor(track.album.cover_medium)
  const haloRef = useRef<PointLight>(null)
  const isPlaying = usePlayerStore((s) => s.isPlaying)

  useFrame(({ clock }) => {
    if (haloRef.current) {
      const t = clock.getElapsedTime()
      // Pulse only while playing — gives the room a heartbeat in lockstep with the music idea
      const pulse = isPlaying ? 1 + Math.sin(t * 1.2) * 0.08 : 0.6
      haloRef.current.intensity = 14 * pulse
    }
  })

  const hex = color ? rgbToHex(color) : '#ffb066'
  return (
    <>
      {/* Halo behind the plinth — picks up its back edge with the cover's color */}
      <pointLight ref={haloRef} position={[0, 0.15, -0.45]} intensity={14} color={hex} distance={2.6} decay={1.5} />
      {/* Front pop — bounces colored light off the platter back into camera */}
      <pointLight position={[0, 0.08, 0.4]} intensity={5} color={hex} distance={1.6} decay={2} />
      {/* Warm rim from below — picks out the plinth edge */}
      <pointLight position={[0, -0.22, 0.25]} intensity={3.5} color={hex} distance={1.8} decay={2} />
      {/* Side accent from the right — separates plinth from background */}
      <pointLight position={[0.55, 0.12, 0.05]} intensity={3} color={hex} distance={1.5} decay={2} />
      {/* Side accent from the left — symmetric atmosphere */}
      <pointLight position={[-0.55, 0.12, 0.05]} intensity={2.2} color={hex} distance={1.5} decay={2} />
    </>
  )
}

export function Turntable(): ReactElement {
  const platterRef = useRef<Mesh>(null)
  const tonearmRef = useRef<Group>(null)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const sceneState = useSceneStore((s) => s.state)

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
      {/* Cover-tinted atmosphere only while we're at the turntable */}
      {sceneState === 'playing' && currentTrack && <TurntableAtmosphere track={currentTrack} />}

      {/* Base / plinth */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[BASE_WIDTH, BASE_HEIGHT, BASE_DEPTH]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.25} metalness={0.7} />
      </mesh>

      {/* Platter — brushed metal with rim detail */}
      <mesh ref={platterRef} position={[0, 0.01, 0]}>
        <cylinderGeometry args={[PLATTER_RADIUS, PLATTER_RADIUS, 0.008, 64]} />
        <meshStandardMaterial color="#3a3a3e" roughness={0.25} metalness={0.85} />
      </mesh>
      {/* Platter rubber mat — subtle circle on top */}
      <mesh position={[0, 0.0145, 0]}>
        <cylinderGeometry args={[PLATTER_RADIUS * 0.96, PLATTER_RADIUS * 0.96, 0.001, 64]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.1} />
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

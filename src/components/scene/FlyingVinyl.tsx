import { useRef } from 'react'
import type { ReactElement } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { TextureLoader, Vector3, DoubleSide } from 'three'
import type { DeezerTrack } from '../../types'

interface FlyingVinylProps {
  track: DeezerTrack
  onComplete: () => void
  startTime: number
  durationMs: number
}

// START_POS matches the hero vinyl's origin in VinylShelf.
// END_POS is the turntable platter.
const START_POS = new Vector3(0, 0, 0)
const END_POS = new Vector3(8, 0.02, 0)
const ARC_HEIGHT = 1.2

const SLEEVE_SIZE = 0.31
const SLEEVE_THICKNESS = 0.006
const DISC_RADIUS = 0.145
const DISC_THICKNESS = 0.003

// Phase breakpoints (0..1 of total progress)
const DISC_EMERGE_START = 0.15
const DISC_EMERGE_END = 0.45
const SLEEVE_FADE_START = 0.45
const SLEEVE_FADE_END = 0.6

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

export function FlyingVinyl({
  track,
  onComplete,
  startTime,
  durationMs,
}: FlyingVinylProps): ReactElement {
  const groupRef = useRef<Group>(null)
  const sleeveRef = useRef<Mesh>(null)
  const discRef = useRef<Group>(null)
  const completedRef = useRef(false)

  const coverTexture = useLoader(TextureLoader, track.album.cover_medium)

  useFrame(() => {
    const elapsed = Date.now() - startTime
    const rawProgress = Math.min(1, elapsed / durationMs)
    const t = easeInOut(rawProgress)

    if (groupRef.current) {
      groupRef.current.position.set(
        START_POS.x + (END_POS.x - START_POS.x) * t,
        START_POS.y + (END_POS.y - START_POS.y) * t + ARC_HEIGHT * Math.sin(rawProgress * Math.PI),
        START_POS.z + (END_POS.z - START_POS.z) * t,
      )
    }

    // Disc slides out of the sleeve (local X offset grows 0 → ~0.4)
    if (discRef.current) {
      const emerge = smoothstep(DISC_EMERGE_START, DISC_EMERGE_END, rawProgress)
      discRef.current.position.x = emerge * 0.45
      // Disc starts UPRIGHT alongside the sleeve, then tilts flat for its
      // landing on the platter. Cylinder geometry defaults to flat (axis Y),
      // so the upright pose is rotation.x = -PI/2.
      const flatness = smoothstep(DISC_EMERGE_END, 0.85, rawProgress)
      discRef.current.rotation.x = -Math.PI / 2 * (1 - flatness)
      discRef.current.rotation.y = rawProgress * Math.PI * 6
    }

    // Sleeve fades out after the disc has emerged
    if (sleeveRef.current) {
      const opacity = 1 - smoothstep(SLEEVE_FADE_START, SLEEVE_FADE_END, rawProgress)
      const mat = sleeveRef.current.material
      if ('opacity' in mat) {
        mat.opacity = opacity
        mat.transparent = opacity < 1
      }
      sleeveRef.current.visible = opacity > 0.02
    }

    if (rawProgress >= 1 && !completedRef.current) {
      completedRef.current = true
      onComplete()
    }
  })

  return (
    <group ref={groupRef}>
      {/* Travelling warm key — the vinyl carries its own light through the void */}
      <pointLight position={[0, 0, 0.4]} intensity={9} color="#fff0d8" distance={2.5} decay={1.8} />
      {/* Tinted halo behind it so it reads as a comet */}
      <pointLight position={[0, 0, -0.35]} intensity={6} color="#ffb066" distance={2} decay={1.6} />

      {/* Sleeve with cover art — self-emissive so the cover stays readable mid-flight */}
      <mesh ref={sleeveRef}>
        <boxGeometry args={[SLEEVE_SIZE, SLEEVE_SIZE, SLEEVE_THICKNESS]} />
        <meshStandardMaterial
          map={coverTexture}
          emissiveMap={coverTexture}
          emissive="#ffffff"
          emissiveIntensity={0.32}
          side={DoubleSide}
          roughness={0.7}
          metalness={0.0}
        />
      </mesh>
      {/* Disc — starts upright alongside the sleeve, flattens for its landing pose */}
      <group ref={discRef}>
        <mesh>
          <cylinderGeometry args={[DISC_RADIUS, DISC_RADIUS, DISC_THICKNESS, 64]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Top label */}
        <mesh position={[0, DISC_THICKNESS / 2 + 0.0005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.05, 48]} />
          <meshStandardMaterial
            map={coverTexture}
            emissiveMap={coverTexture}
            emissive="#ffffff"
            emissiveIntensity={0.4}
            roughness={0.55}
            metalness={0.1}
            side={DoubleSide}
          />
        </mesh>
        {/* Bottom label — real vinyls are double-sided. Keeps the cover visible
            no matter which face of the disc is currently toward the camera. */}
        <mesh position={[0, -DISC_THICKNESS / 2 - 0.0005, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.05, 48]} />
          <meshStandardMaterial
            map={coverTexture}
            emissiveMap={coverTexture}
            emissive="#ffffff"
            emissiveIntensity={0.4}
            roughness={0.55}
            metalness={0.1}
            side={DoubleSide}
          />
        </mesh>
      </group>
    </group>
  )
}

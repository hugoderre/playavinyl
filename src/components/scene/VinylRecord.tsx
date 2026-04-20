import { useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { useLoader } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { TextureLoader, DoubleSide } from 'three'
import type { Mesh, Group } from 'three'
import type { DeezerTrack } from '../../types'

interface VinylRecordProps {
  track: DeezerTrack
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  onClick?: () => void
  onPointerEnter?: () => void
  onPointerLeave?: () => void
}

const SLEEVE_SIZE = 0.31 // ~31cm vinyl sleeve
const DISC_RADIUS = 0.15
const DISC_THICKNESS = 0.003

export function VinylRecord({
  track,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  onClick,
  onPointerEnter,
  onPointerLeave,
}: VinylRecordProps): ReactElement {
  const groupRef = useRef<Group>(null)
  const discRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const coverTexture = useLoader(TextureLoader, track.album.cover_medium)

  const handlePointerEnter = (e: ThreeEvent<PointerEvent>): void => {
    setHovered(true)
    onPointerEnter?.()
    document.body.style.cursor = 'pointer'
    window.dispatchEvent(new CustomEvent('vinyl-hover', {
      detail: { track, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY },
    }))
  }

  const handlePointerLeave = (): void => {
    setHovered(false)
    onPointerLeave?.()
    document.body.style.cursor = 'default'
    window.dispatchEvent(new CustomEvent('vinyl-hover', {
      detail: { track: null, x: 0, y: 0 },
    }))
  }

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      {/* Sleeve — square box with cover art */}
      <mesh
        onClick={onClick}
        onPointerEnter={(e) => handlePointerEnter(e)}
        onPointerLeave={handlePointerLeave}
      >
        <boxGeometry args={[SLEEVE_SIZE, SLEEVE_SIZE, 0.005]} />
        <meshStandardMaterial
          map={coverTexture}
          side={DoubleSide}
          roughness={0.7}
          metalness={0.0}
        />
      </mesh>

      {/* Disc — peeking out to the right on hover */}
      <mesh
        ref={discRef}
        position={[hovered ? SLEEVE_SIZE * 0.3 : 0, 0, -0.001]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[DISC_RADIUS, DISC_RADIUS, DISC_THICKNESS, 64]} />
        <meshStandardMaterial
          color="#111111"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Disc center label */}
      <mesh
        position={[hovered ? SLEEVE_SIZE * 0.3 : 0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.04, 0.04, DISC_THICKNESS + 0.001, 32]} />
        <meshStandardMaterial
          map={coverTexture}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>
    </group>
  )
}

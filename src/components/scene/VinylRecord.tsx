import type { ReactElement } from 'react'
import { useLoader } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { TextureLoader, DoubleSide } from 'three'
import type { DeezerTrack } from '../../types'

interface VinylRecordProps {
  track: DeezerTrack
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  opacity?: number
  onClick?: () => void
  onPointerEnter?: () => void
  onPointerLeave?: () => void
}

const SLEEVE_SIZE = 0.31
const SLEEVE_THICKNESS = 0.006

export function VinylRecord({
  track,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  opacity = 1,
  onClick,
  onPointerEnter,
  onPointerLeave,
}: VinylRecordProps): ReactElement {
  const coverTexture = useLoader(TextureLoader, track.album.cover_medium)

  const handlePointerEnter = (e: ThreeEvent<PointerEvent>): void => {
    onPointerEnter?.()
    document.body.style.cursor = 'pointer'
    window.dispatchEvent(
      new CustomEvent('vinyl-hover', {
        detail: { track, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY },
      }),
    )
  }

  const handlePointerLeave = (): void => {
    onPointerLeave?.()
    document.body.style.cursor = 'default'
    window.dispatchEvent(
      new CustomEvent('vinyl-hover', {
        detail: { track: null, x: 0, y: 0 },
      }),
    )
  }

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Sleeve — thin flat box with cover art on the front face */}
      <mesh
        onClick={onClick}
        onPointerEnter={(e) => handlePointerEnter(e)}
        onPointerLeave={handlePointerLeave}
      >
        <boxGeometry args={[SLEEVE_SIZE, SLEEVE_SIZE, SLEEVE_THICKNESS]} />
        <meshStandardMaterial
          map={coverTexture}
          side={DoubleSide}
          roughness={0.75}
          metalness={0.0}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
    </group>
  )
}

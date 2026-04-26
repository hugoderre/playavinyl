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
  // When false, the record is hint-only: it shows a hover tooltip but the
  // mesh isn't clickable, the cursor doesn't change, and we don't add a
  // forgiving click-catcher. Only the hero is interactive — clicks on the
  // peek edges of stack records would otherwise feel like off-by-one bugs.
  interactive?: boolean
  onClick?: () => void
  onPointerEnter?: () => void
  onPointerLeave?: () => void
}

const SLEEVE_SIZE = 0.31
const SLEEVE_THICKNESS = 0.006
// Forgiving click target — slightly larger than the visible cover so small
// over- or under-shoots still register as a click on the hero.
const HITBOX_SCALE_X = 1.2
const HITBOX_SCALE_Y = 1.12

export function VinylRecord({
  track,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  opacity = 1,
  interactive = false,
  onClick,
  onPointerEnter,
  onPointerLeave,
}: VinylRecordProps): ReactElement {
  // cover_big (500×500) keeps the hero crisp at 30%+ of viewport on retina.
  const coverTexture = useLoader(TextureLoader, track.album.cover_big)

  const handlePointerEnter = (e: ThreeEvent<PointerEvent>): void => {
    onPointerEnter?.()
    if (interactive) document.body.style.cursor = 'pointer'
    window.dispatchEvent(
      new CustomEvent('vinyl-hover', {
        detail: { track, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY },
      }),
    )
  }

  const handlePointerLeave = (): void => {
    onPointerLeave?.()
    if (interactive) document.body.style.cursor = 'default'
    window.dispatchEvent(
      new CustomEvent('vinyl-hover', {
        detail: { track: null, x: 0, y: 0 },
      }),
    )
  }

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Visible sleeve with cover art */}
      <mesh
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

      {/* Forgiving invisible click-catcher — only on the interactive (hero)
          record. Sits just in front of the visible mesh so it always wins the
          raycast tie, and is sized 1.2× × 1.12× so small mis-aims still land. */}
      {interactive && onClick && (
        <mesh position={[0, 0, SLEEVE_THICKNESS]} onClick={onClick}>
          <boxGeometry
            args={[
              SLEEVE_SIZE * HITBOX_SCALE_X,
              SLEEVE_SIZE * HITBOX_SCALE_Y,
              SLEEVE_THICKNESS * 0.5,
            ]}
          />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

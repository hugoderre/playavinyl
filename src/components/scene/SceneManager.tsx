import type { ReactElement } from 'react'
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useSceneStore } from '../../stores/sceneStore'

// Browsing: camera framed on the hero record at origin
// Animating: dollies toward the turntable
// Playing: parked in front of the turntable
const CAMERA_POSITIONS = {
  browsing: new Vector3(0, 0.06, 0.92),
  animating: new Vector3(4, 0.42, 1.4),
  playing: new Vector3(8, 0.5, 1.15),
} as const

const CAMERA_LOOK_AT = {
  browsing: new Vector3(0, -0.01, 0),
  animating: new Vector3(6, 0.15, 0),
  playing: new Vector3(8, 0, 0),
} as const

const LERP_SPEED = 0.035

export function SceneManager(): ReactElement | null {
  const sceneState = useSceneStore((s) => s.state)
  const targetPos = useRef(CAMERA_POSITIONS.browsing.clone())
  const targetLookAt = useRef(CAMERA_LOOK_AT.browsing.clone())
  const currentLookAt = useRef(CAMERA_LOOK_AT.browsing.clone())
  const { camera } = useThree()

  useFrame(() => {
    const target = CAMERA_POSITIONS[sceneState]
    const lookAt = CAMERA_LOOK_AT[sceneState]

    targetPos.current.copy(target)
    targetLookAt.current.copy(lookAt)

    // Smooth camera movement
    camera.position.lerp(targetPos.current, LERP_SPEED)
    currentLookAt.current.lerp(targetLookAt.current, LERP_SPEED)
    camera.lookAt(currentLookAt.current)
  })

  return null
}

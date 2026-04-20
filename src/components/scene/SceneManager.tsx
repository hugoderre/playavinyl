import type { ReactElement } from 'react'
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useSceneStore } from '../../stores/sceneStore'

const CAMERA_POSITIONS = {
  browsing: new Vector3(0, 0.3, 1.5),
  animating: new Vector3(1, 0.3, 1),
  playing: new Vector3(2, 0.4, 1.2),
} as const

const CAMERA_LOOK_AT = {
  browsing: new Vector3(0, 0, -0.5),
  animating: new Vector3(1, 0, 0),
  playing: new Vector3(2, 0, 0),
} as const

const LERP_SPEED = 0.03

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

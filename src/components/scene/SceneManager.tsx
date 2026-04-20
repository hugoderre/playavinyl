import type { ReactElement } from 'react'
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useSceneStore } from '../../stores/sceneStore'

// Browsing: camera sits foreground-left, looks up-and-right along the diagonal
//           so the row of vinyls recedes toward the top-right of the screen
// Animating: pans toward the turntable
// Playing: settled in front of the turntable
// Browsing: camera centered & pulled back, looking slightly up and slightly right
//           so the diagonal (near-left-low → far-right-up) lands diagonally
//           across the frame exactly like MOCK-VINYL-FLOW.html.
// Animating: pans toward the turntable
// Playing: settled in front of the turntable
const CAMERA_POSITIONS = {
  browsing: new Vector3(0, 0.35, 2.3),
  animating: new Vector3(3.5, 0.5, 1.8),
  playing: new Vector3(8, 0.5, 1.2),
} as const

const CAMERA_LOOK_AT = {
  browsing: new Vector3(0.6, 0.45, -0.8),
  animating: new Vector3(6, 0.2, 0),
  playing: new Vector3(8, 0, 0),
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

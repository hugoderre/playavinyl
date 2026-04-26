import type { ReactElement } from 'react'
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useSceneStore } from '../../stores/sceneStore'

// Camera choreography:
// - Browsing: framed on the hero record at origin
// - Animating: dollies from browse to turntable, looking at the flying vinyl
//   so it always stays in frame like a comet the camera is tracking
// - Playing: parked in front of the turntable

// Must match App.tsx ANIMATION_DURATION_MS and FlyingVinyl's path constants.
const ANIMATION_DURATION_MS = 4000
const FLY_START = new Vector3(0, 0, 0)
const FLY_END = new Vector3(8, 0.02, 0)
const FLY_ARC_HEIGHT = 1.2

const BROWSE_POS = new Vector3(0, 0.06, 0.92)
const BROWSE_LOOKAT = new Vector3(0, -0.01, 0)
const PLAYING_POS = new Vector3(8, 0.5, 1.15)
const PLAYING_LOOKAT = new Vector3(8, 0, 0)

const LERP_SPEED_BASE = 0.045
const LERP_SPEED_TRACKING = 0.16

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function flyPos(progress: number, out: Vector3): Vector3 {
  const t = easeInOut(progress)
  out.set(
    FLY_START.x + (FLY_END.x - FLY_START.x) * t,
    FLY_START.y + (FLY_END.y - FLY_START.y) * t + FLY_ARC_HEIGHT * Math.sin(progress * Math.PI),
    FLY_START.z + (FLY_END.z - FLY_START.z) * t,
  )
  return out
}

export function SceneManager(): ReactElement | null {
  const sceneState = useSceneStore((s) => s.state)
  const animStart = useSceneStore((s) => s.animationStartedAt)
  const targetPos = useRef(BROWSE_POS.clone())
  const targetLookAt = useRef(BROWSE_LOOKAT.clone())
  const currentLookAt = useRef(BROWSE_LOOKAT.clone())
  const tmpVinyl = useRef(new Vector3())
  const { camera } = useThree()

  useFrame(() => {
    let lerpSpeed = LERP_SPEED_BASE

    if (sceneState === 'browsing') {
      targetPos.current.copy(BROWSE_POS)
      targetLookAt.current.copy(BROWSE_LOOKAT)
    } else if (sceneState === 'playing') {
      targetPos.current.copy(PLAYING_POS)
      targetLookAt.current.copy(PLAYING_LOOKAT)
    } else if (sceneState === 'animating' && animStart > 0) {
      const progress = Math.min(1, (Date.now() - animStart) / ANIMATION_DURATION_MS)

      // Camera dolly: hold on the hero through the lift-off, then smoothly
      // travel to the turntable, then settle. Smoothstep gives a natural
      // ease-in/out feel that's separate from the vinyl's own easing.
      const dollyProgress = smoothstep(0.18, 0.88, progress)
      targetPos.current.lerpVectors(BROWSE_POS, PLAYING_POS, dollyProgress)

      // Track the vinyl, but pull the lookAt down so the vinyl rides the
      // upper-third (the cinematic "lead room" rule) instead of sitting dead
      // center. Bias toward the turntable as the journey nears its end.
      const vp = flyPos(progress, tmpVinyl.current)
      const targetBias = smoothstep(0.55, 0.95, progress)
      targetLookAt.current.set(
        vp.x * (1 - targetBias) + PLAYING_LOOKAT.x * targetBias,
        Math.max(-0.05, vp.y - 0.45),
        vp.z * (1 - targetBias) + PLAYING_LOOKAT.z * targetBias,
      )
      // Track the vinyl quickly during the journey so it never feels lagged.
      lerpSpeed = LERP_SPEED_TRACKING
    }

    camera.position.lerp(targetPos.current, lerpSpeed)
    currentLookAt.current.lerp(targetLookAt.current, lerpSpeed)
    camera.lookAt(currentLookAt.current)
  })

  return null
}

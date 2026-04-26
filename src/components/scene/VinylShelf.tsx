import { useEffect, useRef, Suspense } from 'react'
import type { ReactElement } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import type { Group, PointLight } from 'three'
import { VinylRecord } from './VinylRecord'
import { useSceneStore } from '../../stores/sceneStore'
import { useDominantColor, rgbToHex } from '../../hooks/useDominantColor'
import type { DeezerTrack } from '../../types'

// One vinyl is the hero, fully facing the camera. Everything else is
// hinted: only the right edge of the next 6 records peeks out, like
// a wallet of cards. Steve Jobs filter — no clutter, just the one
// you're meant to listen to.

const STACK_DEPTH = 6

const STACK_X_PER_DEPTH = 0.068
const STACK_Z_PER_DEPTH = -0.045
const STACK_ROT_Y_PER_DEPTH = 0.115
// Stack records start dim at depth 1 (=0.78) and fade further with depth.
// Steve Jobs filter: the hero earns the eye, the stack is hint, not display.
const STACK_OPACITY_AT_HERO = 1
const STACK_OPACITY_DROP_FIRST = 0.22
const STACK_OPACITY_FALLOFF = 0.10

// When the hero is overtaken by a scroll, it slides left and rotates
// off-camera. Tuned so the curve feels like handing a record to
// someone standing to your left.
const EXIT_X_AT_FULL = -1.4
const EXIT_Z_AT_FULL = 0.18
const EXIT_ROT_Y_AT_FULL = -0.85

const SETTLE_DELAY_MS = 110
const SETTLE_LERP = 0.18
const WHEEL_SCALE = 0.0022

interface Placement {
  x: number
  y: number
  z: number
  rotY: number
  opacity: number
}

function placementForDepth(depth: number): Placement {
  if (depth >= 0) {
    const baseOpacity =
      depth < 1
        ? STACK_OPACITY_AT_HERO - (STACK_OPACITY_AT_HERO - (1 - STACK_OPACITY_DROP_FIRST)) * depth
        : 1 - STACK_OPACITY_DROP_FIRST - STACK_OPACITY_FALLOFF * (depth - 1)
    return {
      x: STACK_X_PER_DEPTH * depth,
      y: 0,
      z: STACK_Z_PER_DEPTH * depth,
      rotY: STACK_ROT_Y_PER_DEPTH * depth,
      opacity: Math.max(0, baseOpacity),
    }
  }
  // depth in [-1, 0): record leaving stage left
  const t = -depth // 0 → just left hero, 1 → fully gone
  return {
    x: EXIT_X_AT_FULL * t,
    y: 0,
    z: EXIT_Z_AT_FULL * t,
    rotY: EXIT_ROT_Y_AT_FULL * t,
    opacity: Math.max(0, 1 - t * 1.05),
  }
}

export function VinylShelf(): ReactElement | null {
  const tracks = useSceneStore((s) => s.tracks)
  const scrollPosition = useSceneStore((s) => s.scrollPosition)
  const setScrollPosition = useSceneStore((s) => s.setScrollPosition)
  const selectVinyl = useSceneStore((s) => s.selectVinyl)
  const selectedVinylId = useSceneStore((s) => s.selectedVinylId)
  const sceneState = useSceneStore((s) => s.state)
  const { gl } = useThree()
  const lastInteractionRef = useRef(0)
  const breathRef = useRef<Group>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (sceneState !== 'browsing') return

    const canvas = gl.domElement

    const handleWheel = (e: WheelEvent): void => {
      e.preventDefault()
      const { scrollPosition: current, tracks: ts } = useSceneStore.getState()
      const maxScroll = Math.max(0, ts.length - 1)
      const next = Math.max(0, Math.min(maxScroll, current + e.deltaY * WHEEL_SCALE))
      useSceneStore.getState().setScrollPosition(next)
      lastInteractionRef.current = performance.now()
    }

    const handleKey = (e: KeyboardEvent): void => {
      const { scrollPosition: current, tracks: ts } = useSceneStore.getState()
      const maxScroll = Math.max(0, ts.length - 1)
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        useSceneStore
          .getState()
          .setScrollPosition(Math.min(maxScroll, Math.round(current) + 1))
        lastInteractionRef.current = 0 // settle immediately to the new integer
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        useSceneStore
          .getState()
          .setScrollPosition(Math.max(0, Math.round(current) - 1))
        lastInteractionRef.current = 0
      }
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKey)
    return (): void => {
      canvas.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKey)
    }
  }, [gl, sceneState])

  // Mouse parallax — the crate gently leans toward the cursor.
  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', handler)
    return (): void => window.removeEventListener('mousemove', handler)
  }, [])

  // Settle to nearest integer once the user stops scrolling, so a single
  // record always becomes THE hero — no fractional limbo. Also breathe the
  // whole crate so the scene never feels frozen.
  useFrame(({ clock }) => {
    if (breathRef.current) {
      const t = clock.getElapsedTime()
      const breathRotY = Math.sin(t * 0.32) * 0.014
      const breathPosY = Math.sin(t * 0.42 + 1.3) * 0.006
      // Mouse parallax — eased toward target so it never snaps.
      const targetRotY = mouseRef.current.x * 0.045
      const targetRotX = -mouseRef.current.y * 0.035
      breathRef.current.rotation.y += (breathRotY + targetRotY - breathRef.current.rotation.y) * 0.08
      breathRef.current.rotation.x += (targetRotX - breathRef.current.rotation.x) * 0.08
      breathRef.current.position.y = breathPosY
    }

    if (sceneState !== 'browsing') return
    if (performance.now() - lastInteractionRef.current < SETTLE_DELAY_MS) return
    const target = Math.round(scrollPosition)
    const diff = target - scrollPosition
    if (Math.abs(diff) < 0.0005) {
      if (scrollPosition !== target) setScrollPosition(target)
      return
    }
    setScrollPosition(scrollPosition + diff * SETTLE_LERP)
  })

  if (sceneState === 'playing') return null

  const heroIdx = Math.round(scrollPosition)
  const heroTrack = tracks[heroIdx]

  // Render window: one record leaving + the hero + the stack.
  const renderItems: { track: DeezerTrack; depth: number }[] = []
  for (let i = -1; i <= STACK_DEPTH; i++) {
    const trackIdx = heroIdx + i
    const t = tracks[trackIdx]
    if (!t) continue
    const depth = trackIdx - scrollPosition
    if (depth < -1.05 || depth > STACK_DEPTH + 0.5) continue
    renderItems.push({ track: t, depth })
  }

  return (
    <group>
      {heroTrack && <HeroAtmosphere track={heroTrack} />}

      <group ref={breathRef}>
      <Suspense fallback={null}>
        {renderItems.map(({ track, depth }) => {
          if (sceneState === 'animating' && track.id === selectedVinylId) return null
          const p = placementForDepth(depth)
          if (p.opacity < 0.02) return null

          return (
            <VinylRecord
              key={track.id}
              track={track}
              position={[p.x, p.y, p.z]}
              rotation={[0, p.rotY, 0]}
              opacity={p.opacity}
              onClick={() => sceneState === 'browsing' && selectVinyl(track.id)}
            />
          )
        })}
      </Suspense>
      </group>
    </group>
  )
}

// Atmosphere tinted by the hero's dominant color. No furniture, no crate —
// just light shaping space around the record.
const HALO_BASE_INTENSITY = 28

function HeroAtmosphere({ track }: { track: DeezerTrack }): ReactElement | null {
  const color = useDominantColor(track.album.cover_medium)
  const hex = color ? rgbToHex(color) : '#ffb066'
  const haloRef = useRef<PointLight>(null)

  // Subtle breathing pulse on the halo — locks the scene's heartbeat
  // visible without ever drawing attention to itself.
  useFrame(({ clock }) => {
    if (haloRef.current) {
      const t = clock.getElapsedTime()
      haloRef.current.intensity = HALO_BASE_INTENSITY * (1 + Math.sin(t * 0.42 + 1.3) * 0.075)
    }
  })

  return (
    <>
      {/* Warm key from front-left — sculpts the cover face, works on any color */}
      <pointLight position={[-0.22, 0.28, 0.6]} intensity={6.5} color="#fff0d8" distance={2.0} decay={2} />
      {/* Tight warm fill from the right — adds a second highlight, prevents flatness */}
      <pointLight position={[0.35, -0.05, 0.55]} intensity={2.4} color="#ffd9a8" distance={1.5} decay={2} />

      {/* Big colored halo behind the hero — pulses gently with the scene's breath */}
      <pointLight ref={haloRef} position={[0, 0.0, -0.7]} intensity={HALO_BASE_INTENSITY} color={hex} distance={3.6} decay={1.4} />
      {/* Close pop in front, tinted by cover */}
      <pointLight position={[-0.05, 0.05, 0.45]} intensity={4.5} color={hex} distance={1.6} decay={2} />
      {/* Warm rim from below — grounds the record without drawing a floor */}
      <pointLight position={[0, -0.32, 0.25]} intensity={4.2} color={hex} distance={1.6} decay={2} />
    </>
  )
}

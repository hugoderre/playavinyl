import { useEffect, useMemo, useRef, Suspense } from 'react'
import type { ReactElement } from 'react'
import { useThree, useFrame, useLoader } from '@react-three/fiber'
import { Color, TextureLoader } from 'three'
import type { Group, PointLight } from 'three'
import { VinylRecord } from './VinylRecord'
import { useSceneStore } from '../../stores/sceneStore'
import { useDominantColor } from '../../hooks/useDominantColor'
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
  const heroHoverRef = useRef(false)
  const heroScaleRef = useRef(1)
  const heroGroupRef = useRef<Group>(null)

  // Preload all cover textures as soon as the track list arrives so
  // VinylRecord never suspends mid-scroll and causes a frame blackout.
  useEffect(() => {
    tracks.forEach((t) => useLoader.preload(TextureLoader, t.album.cover_big))
  }, [tracks])

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
      // Don't hijack cursor keys / Enter while the user is typing in the search bar.
      const active = document.activeElement
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return

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
      } else if (e.key === 'Enter' || e.key === ' ') {
        // Enter/Space plays the hero — primary keyboard action while browsing.
        const heroIdx = Math.round(current)
        const heroTrack = ts[heroIdx]
        if (heroTrack) {
          e.preventDefault()
          useSceneStore.getState().selectVinyl(heroTrack.id)
        }
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

    // Hero hover-scale — signals "I'm clickable" without ever being a pop-up.
    if (heroGroupRef.current) {
      const target = heroHoverRef.current && sceneState === 'browsing' ? 1.04 : 1
      heroScaleRef.current += (target - heroScaleRef.current) * 0.16
      heroGroupRef.current.scale.setScalar(heroScaleRef.current)
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

  // Atmosphere blends between the two tracks the scroll currently sits between,
  // so the lighting tint never jumps when the hero index flips. We pick floor +
  // ceil so the lerp tracks the visible crossfade between records.
  const floorIdx = Math.max(0, Math.min(tracks.length - 1, Math.floor(scrollPosition)))
  const ceilIdx = Math.max(0, Math.min(tracks.length - 1, floorIdx + 1))
  const blendFrac = Math.min(1, Math.max(0, scrollPosition - floorIdx))
  const trackA = tracks[floorIdx]
  const trackB = tracks[ceilIdx]

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
      {heroTrack && <HeroAtmosphere trackA={trackA} trackB={trackB} blend={blendFrac} />}

      <group ref={breathRef}>
        {renderItems.map(({ track, depth }) => {
          if (sceneState === 'animating' && track.id === selectedVinylId) return null
          const p = placementForDepth(depth)
          if (p.opacity < 0.02) return null

          // Only the hero (depth ≈ 0) is interactive: clickable, gets the
          // hover-scale signal and a forgiving hitbox. Stack records are
          // hint-only — clicking their peek edges would feel like an
          // off-by-one bug.
          const isHero = Math.abs(depth) < 0.5

          // Each record gets its own Suspense boundary so an un-cached texture
          // on one record only hides that record — not the entire shelf.
          const recordEl = (
            <Suspense fallback={null}>
              <VinylRecord
                track={track}
                position={[p.x, p.y, p.z]}
                rotation={[0, p.rotY, 0]}
                opacity={p.opacity}
                interactive={isHero && sceneState === 'browsing'}
                onClick={
                  isHero && sceneState === 'browsing'
                    ? () => selectVinyl(track.id)
                    : undefined
                }
                onPointerEnter={isHero ? () => { heroHoverRef.current = true } : undefined}
                onPointerLeave={isHero ? () => { heroHoverRef.current = false } : undefined}
              />
            </Suspense>
          )

          // When isHero flips back to false on scroll, force scale back to 1 —
          // otherwise R3F doesn't touch the dynamically-set 1.04 hover scale
          // and the ex-hero stays subtly larger as a stack record.
          return isHero ? (
            <group key={track.id} ref={heroGroupRef}>
              {recordEl}
            </group>
          ) : (
            <group key={track.id} scale={1}>
              {recordEl}
            </group>
          )
        })}
      </group>
    </group>
  )
}

// Atmosphere tinted by the hero's dominant color. No furniture, no crate —
// just light shaping space around the record.
const HALO_BASE_INTENSITY = 28
const FALLBACK_TINT: [number, number, number] = [255, 176, 102] // #ffb066

function HeroAtmosphere({
  trackA,
  trackB,
  blend,
}: {
  trackA: DeezerTrack | undefined
  trackB: DeezerTrack | undefined
  blend: number
}): ReactElement | null {
  // Use cover_big to share the cache with the visible record texture — same URL → one fetch.
  const colorA = useDominantColor(trackA?.album.cover_big)
  const colorB = useDominantColor(trackB?.album.cover_big)

  const haloRef = useRef<PointLight>(null)
  const popRef = useRef<PointLight>(null)
  const rimRef = useRef<PointLight>(null)
  // A single mutable Color we re-use each frame to avoid per-frame allocations.
  const tintRef = useRef<Color>(useMemo(() => new Color(), []))
  // The currently-applied tint, eased toward the lerped target each frame so a
  // dominant color that lands late (cache miss) fades in instead of popping.
  const currentRef = useRef<[number, number, number]>([...FALLBACK_TINT])

  useFrame(({ clock }) => {
    const a = colorA ?? colorB ?? FALLBACK_TINT
    const b = colorB ?? colorA ?? FALLBACK_TINT
    const targetR = a[0] * (1 - blend) + b[0] * blend
    const targetG = a[1] * (1 - blend) + b[1] * blend
    const targetB = a[2] * (1 - blend) + b[2] * blend

    // Critically-damped feel: catch up fast enough that the tint tracks the
    // scroll, but slow enough to absorb a late-arriving dominant color without
    // a visible step.
    const k = 0.18
    const cur = currentRef.current
    cur[0] += (targetR - cur[0]) * k
    cur[1] += (targetG - cur[1]) * k
    cur[2] += (targetB - cur[2]) * k
    tintRef.current.setRGB(cur[0] / 255, cur[1] / 255, cur[2] / 255)

    if (haloRef.current) {
      haloRef.current.color.copy(tintRef.current)
      const t = clock.getElapsedTime()
      haloRef.current.intensity = HALO_BASE_INTENSITY * (1 + Math.sin(t * 0.42 + 1.3) * 0.075)
    }
    if (popRef.current) popRef.current.color.copy(tintRef.current)
    if (rimRef.current) rimRef.current.color.copy(tintRef.current)
  })

  return (
    <>
      {/* Warm key from front-left — sculpts the cover face, works on any color */}
      <pointLight position={[-0.22, 0.28, 0.6]} intensity={3.2} color="#fff0d8" distance={2.0} decay={2} />
      {/* Tight warm fill from the right — adds a second highlight, prevents flatness */}
      <pointLight position={[0.35, -0.05, 0.55]} intensity={1.2} color="#ffd9a8" distance={1.5} decay={2} />

      {/* Big colored halo behind the hero — pulses gently with the scene's breath */}
      <pointLight ref={haloRef} position={[0, 0.0, -0.7]} intensity={HALO_BASE_INTENSITY} distance={3.6} decay={1.4} />
      {/* Close pop in front, tinted by cover */}
      <pointLight ref={popRef} position={[-0.05, 0.05, 0.45]} intensity={2.0} distance={1.6} decay={2} />
      {/* Warm rim from below — grounds the record without drawing a floor */}
      <pointLight ref={rimRef} position={[0, -0.32, 0.25]} intensity={2.0} distance={1.6} decay={2} />
    </>
  )
}

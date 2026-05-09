import { useRef, Suspense } from 'react'
import type { ReactElement } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import type { Mesh, Group, PointLight } from 'three'
import { TextureLoader } from 'three'
import { usePlayerStore } from '../../stores/playerStore'
import { useDominantColor, rgbToHex } from '../../hooks/useDominantColor'
import { useSceneStore } from '../../stores/sceneStore'
import type { DeezerTrack } from '../../types'

const PLATTER_RADIUS = 0.15
const BASE_WIDTH = 0.45
const BASE_DEPTH = 0.35
const BASE_HEIGHT = 0.04
const RPM = 33.33
const RADIANS_PER_SECOND = (RPM / 60) * Math.PI * 2

// Must match App.tsx ANIMATION_DURATION_MS — the atmosphere ramp is tied
// to the same clock so the lights grow in lockstep with the vinyl's flight.
const ANIMATION_DURATION_MS = 4000

// Tonearm rotation positions. Empirically tuned so the headshell tracks the
// playable groove area: REST sits just off the disc edge, OUTER lands on
// the outer rim, INNER stops just past the label without ever crossing it.
const TONEARM_REST = 0.3
const TONEARM_OUTER_GROOVE = 0.28
const TONEARM_INNER_GROOVE = 0.14
// Deezer previews are 30 s; map the audio progress across the groove width.
const PREVIEW_DURATION_S = 30

// Same easing as FlyingVinyl + SceneManager — the ramp grows in lockstep
// with the vinyl's xz-distance toward the platter, so the lights "appear"
// because the vinyl is bringing them, not because of an arbitrary timer.
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

interface VinylOnPlatterProps {
  track: DeezerTrack
}

function VinylOnPlatter({ track }: VinylOnPlatterProps): ReactElement {
  const discRef = useRef<Group>(null)
  // Same cover_big URL as the rest of the flow → browser cache hit, instant.
  const coverTexture = useLoader(TextureLoader, track.album.cover_big)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  // Spin velocity lerps toward target so the disc spools up and coasts to a
  // stop with inertia, like a real platter — never an abrupt cut.
  const spinVelocityRef = useRef(0)

  useFrame((_, delta) => {
    const target = isPlaying ? RADIANS_PER_SECOND : 0
    spinVelocityRef.current += (target - spinVelocityRef.current) * 0.035
    if (discRef.current && Math.abs(spinVelocityRef.current) > 0.001) {
      discRef.current.rotation.y += spinVelocityRef.current * delta
    }
  })

  return (
    <group ref={discRef} position={[0, 0.018, 0]}>
      {/* Disc body — softer, less metallic so it actually reads against the bright platter */}
      <mesh>
        <cylinderGeometry
          args={[PLATTER_RADIUS - 0.005, PLATTER_RADIUS - 0.005, 0.002, 64]}
        />
        <meshStandardMaterial color="#0c0c0c" roughness={0.55} metalness={0.35} />
      </mesh>
      {/* Outer groove highlight ring */}
      <mesh position={[0, 0.0011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.13, 0.135, 64]} />
        <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Inner groove highlight ring */}
      <mesh position={[0, 0.0011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.095, 0.098, 64]} />
        <meshStandardMaterial color="#1f1f1f" roughness={0.35} metalness={0.55} />
      </mesh>
      {/* Center label — bigger than real life so the cover art is the hero */}
      <mesh position={[0, 0.0015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.085, 48]} />
        <meshStandardMaterial
          map={coverTexture}
          emissiveMap={coverTexture}
          emissive="#ffffff"
          emissiveIntensity={0.42}
          roughness={0.5}
          metalness={0.05}
        />
      </mesh>
      {/* Spindle hole — small dark circle at the dead center */}
      <mesh position={[0, 0.0017, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.004, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  )
}

// Atmospheric glow tinted by the playing track's dominant color — same
// language as the hero's atmosphere at the shelf, so the turntable feels
// like the same room.
//
// CRITICAL: this stays mounted from scene boot, intensity 0 when idle. If
// the lights mounted lazily (only at 'animating'/'playing'), Three.js would
// re-link the materials' shaders the first time the camera dollied close
// enough to render the turntable with these lights — that's a frame skip
// at apex. Always-mounted means the shader is compiled once at boot and
// every flight after is silky.
//
// The ramp during the flight is `easeInOut(progress)` — the same easing
// that drives the vinyl's xz position. The lights grow in lockstep with
// the vinyl's approach, so visually it reads as "the vinyl is bringing
// the color into the room", not "an arbitrary fade-in".
function TurntableAtmosphere({ track }: { track: DeezerTrack | null }): ReactElement {
  const color = useDominantColor(track?.album.cover_big)
  const haloRef = useRef<PointLight>(null)
  const frontRef = useRef<PointLight>(null)
  const bottomRef = useRef<PointLight>(null)
  const rightRef = useRef<PointLight>(null)
  const leftRef = useRef<PointLight>(null)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const sceneState = useSceneStore((s) => s.state)
  const animStart = useSceneStore((s) => s.animationStartedAt)
  // Brief energy flash when audio starts — simulates the needle hitting the groove.
  const dropFlashRef = useRef(0)
  const wasPlayingRef = useRef(false)
  // Pulse lerps to its target so the brief async window between
  // sceneState→playing and isPlaying→true never produces a dim flicker.
  const pulseRef = useRef(1)

  useFrame(({ clock }) => {
    // Ramp tied to vinyl motion — easeInOut is identical to FlyingVinyl's
    // xz easing, so the lights and the vinyl's xz position grow as one.
    let ramp = 0
    if (sceneState === 'playing') {
      ramp = 1
    } else if (sceneState === 'animating' && animStart > 0) {
      const progress = Math.min(1, (Date.now() - animStart) / ANIMATION_DURATION_MS)
      ramp = easeInOut(progress)
    }

    if (isPlaying && !wasPlayingRef.current) {
      dropFlashRef.current = 1
    }
    wasPlayingRef.current = isPlaying
    dropFlashRef.current = Math.max(0, dropFlashRef.current - 0.045)

    // Treat the inbound flight as "music about to play" so the breathing
    // pulse already sits at the playing level when audio actually starts —
    // no second jump on top of the ramp.
    const t = clock.getElapsedTime()
    const audioActiveOrPreparing = isPlaying || sceneState === 'animating'
    const targetPulse = audioActiveOrPreparing ? 1 + Math.sin(t * 1.2) * 0.08 : 0.6
    pulseRef.current += (targetPulse - pulseRef.current) * 0.08
    const flashBoost = 1 + dropFlashRef.current * 0.55

    if (haloRef.current) {
      haloRef.current.intensity = 14 * pulseRef.current * flashBoost * ramp
    }
    if (frontRef.current) frontRef.current.intensity = 5 * ramp
    if (bottomRef.current) bottomRef.current.intensity = 3.5 * ramp
    if (rightRef.current) rightRef.current.intensity = 3 * ramp
    if (leftRef.current) leftRef.current.intensity = 2.2 * ramp
  })

  const hex = color ? rgbToHex(color) : '#ffb066'
  return (
    <>
      {/* Halo behind the plinth — picks up its back edge with the cover's color */}
      <pointLight ref={haloRef} position={[0, 0.15, -0.45]} intensity={0} color={hex} distance={2.6} decay={1.5} />
      {/* Front pop — bounces colored light off the platter back into camera */}
      <pointLight ref={frontRef} position={[0, 0.08, 0.4]} intensity={0} color={hex} distance={1.6} decay={2} />
      {/* Warm rim from below — picks out the plinth edge */}
      <pointLight ref={bottomRef} position={[0, -0.22, 0.25]} intensity={0} color={hex} distance={1.8} decay={2} />
      {/* Side accent from the right — separates plinth from background */}
      <pointLight ref={rightRef} position={[0.55, 0.12, 0.05]} intensity={0} color={hex} distance={1.5} decay={2} />
      {/* Side accent from the left — symmetric atmosphere */}
      <pointLight ref={leftRef} position={[-0.55, 0.12, 0.05]} intensity={0} color={hex} distance={1.5} decay={2} />
    </>
  )
}

export function Turntable(): ReactElement {
  const platterRef = useRef<Mesh>(null)
  const tonearmRef = useRef<Group>(null)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const progress = usePlayerStore((s) => s.progress)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const sceneState = useSceneStore((s) => s.state)
  const selectedVinylId = useSceneStore((s) => s.selectedVinylId)
  const tracks = useSceneStore((s) => s.tracks)
  const platterVelocityRef = useRef(0)

  useFrame((_, delta) => {
    const target = isPlaying ? RADIANS_PER_SECOND : 0
    platterVelocityRef.current += (target - platterVelocityRef.current) * 0.035
    if (platterRef.current && Math.abs(platterVelocityRef.current) > 0.001) {
      platterRef.current.rotation.y += platterVelocityRef.current * delta
    }

    if (tonearmRef.current) {
      let targetRotation: number
      if (isPlaying) {
        // Real vinyls play outside-in. Map the preview's audio progress
        // (0→30 s) onto the groove area so the needle visibly drifts toward
        // the label as the song plays — without ever crossing it.
        const trackProgress = Math.max(0, Math.min(1, progress / PREVIEW_DURATION_S))
        targetRotation =
          TONEARM_OUTER_GROOVE -
          (TONEARM_OUTER_GROOVE - TONEARM_INNER_GROOVE) * trackProgress
      } else {
        targetRotation = TONEARM_REST
      }
      tonearmRef.current.rotation.y +=
        (targetRotation - tonearmRef.current.rotation.y) * 0.05
    }
  })

  // The atmosphere needs the *incoming* cover during the flight so the room
  // can start glowing in the right color before the vinyl lands. Once
  // playing, currentTrack and the incoming track point to the same object,
  // so the prop swap is a no-op for the dominant-color cache.
  const incomingTrack =
    sceneState === 'animating'
      ? tracks.find((t) => t.id === selectedVinylId) ?? null
      : null
  const atmosphereTrack = sceneState === 'animating' ? incomingTrack : currentTrack

  return (
    <group position={[8, 0, 0]}>
      {/* Always mounted so the 5 point lights are in the scene from boot —
          shader compiles once, no apex frame-skip when the camera dollies in. */}
      <TurntableAtmosphere track={atmosphereTrack} />

      {/* Base / plinth */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[BASE_WIDTH, BASE_HEIGHT, BASE_DEPTH]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.25} metalness={0.7} />
      </mesh>

      {/* Platter — brushed metal with rim detail */}
      <mesh ref={platterRef} position={[0, 0.01, 0]}>
        <cylinderGeometry args={[PLATTER_RADIUS, PLATTER_RADIUS, 0.008, 64]} />
        <meshStandardMaterial color="#3a3a3e" roughness={0.25} metalness={0.85} />
      </mesh>
      {/* Platter rubber mat — subtle circle on top */}
      <mesh position={[0, 0.0145, 0]}>
        <cylinderGeometry args={[PLATTER_RADIUS * 0.96, PLATTER_RADIUS * 0.96, 0.001, 64]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Platter center spindle */}
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.02, 16]} />
        <meshStandardMaterial color="#888888" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Current vinyl on the platter */}
      {currentTrack && (
        <Suspense fallback={null}>
          <VinylOnPlatter track={currentTrack} />
        </Suspense>
      )}

      {/* Tonearm assembly. Headshell sits exactly at the arm's tip:
          arm centered at (-0.1, 0.01, 0.08), length 0.2 in z, rotated -0.3
          around Y → tip at ≈(-0.130, 0.01, 0.176). Cartridge nudged a hair
          past that along the arm's direction and dropped slightly in y so
          it visually hangs under the arm with the diamond at the bottom. */}
      <group ref={tonearmRef} position={[0.18, 0.025, -0.1]}>
        <mesh>
          <cylinderGeometry args={[0.012, 0.012, 0.02, 16]} />
          <meshStandardMaterial color="#333333" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[-0.1, 0.01, 0.08]} rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.005, 0.005, 0.2]} />
          <meshStandardMaterial color="#666666" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[-0.133, 0.004, 0.187]} rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.015, 0.008, 0.025]} />
          <meshStandardMaterial color="#444444" roughness={0.4} metalness={0.7} />
        </mesh>
      </group>

      {/* Power button indicator */}
      <mesh position={[0.18, 0.025, 0.14]}>
        <sphereGeometry args={[0.005, 16, 16]} />
        <meshStandardMaterial
          color={isPlaying ? '#e67e22' : '#333333'}
          emissive={isPlaying ? '#e67e22' : '#000000'}
          emissiveIntensity={isPlaying ? 0.5 : 0}
        />
      </mesh>
    </group>
  )
}

import type { ReactElement } from 'react'
import { useRef } from 'react'
import type { SpotLight as SpotLightImpl, Object3D } from 'three'
import { useFrame } from '@react-three/fiber'
import { usePlayerStore } from '../../stores/playerStore'

export function SceneLighting(): ReactElement {
  const spotRef = useRef<SpotLightImpl>(null)
  const targetRef = useRef<Object3D>(null)
  const progress = usePlayerStore((s) => s.progress)

  // Sync the spotlight to aim at its target on every frame
  useFrame(() => {
    if (spotRef.current && targetRef.current) {
      spotRef.current.target = targetRef.current
      spotRef.current.target.updateMatrixWorld()
    }
  })

  // Subtle intensity pulse while playing
  const pulseIntensity = 55 + Math.sin(progress * Math.PI * 2) * 5

  return (
    <>
      {/* Low ambient — keeps the hero pop forward, lets the dominant-color glow do the work */}
      <ambientLight intensity={0.32} color="#d8d0c4" />

      {/* Tight warm key light from above-front, focused on the hero zone */}
      <pointLight
        position={[0, 1.6, 1.2]}
        intensity={8}
        color="#fff0d8"
        distance={5}
        decay={2}
      />

      {/* Warm rim from the left (atmosphere) */}
      <pointLight
        position={[-3, 1.2, 0.5]}
        intensity={8}
        color="#e67e22"
        distance={7}
        decay={2}
      />

      {/* Cool accent from back-right (separates vinyls from background) */}
      <pointLight
        position={[4, 1.8, -2]}
        intensity={10}
        color="#7fa8d0"
        distance={8}
        decay={2}
      />

      {/* Turntable stage spotlight — dramatic focused beam from above */}
      <spotLight
        ref={spotRef}
        position={[8, 2.8, 0.8]}
        angle={0.45}
        penumbra={0.6}
        intensity={pulseIntensity}
        color="#fff5e0"
        distance={6}
        decay={2}
        castShadow
      />
      {/* Invisible target object that the spotlight aims at */}
      <object3D ref={targetRef} position={[8, 0, 0]} />

      {/* Turntable warm fill from below-right (suggests a lamp on the side) */}
      <pointLight
        position={[8.6, 0.5, 0.8]}
        intensity={6}
        color="#e67e22"
        distance={3}
        decay={2}
      />

      {/* Loose fog for depth — objects at 18m+ fade */}
      <fog attach="fog" args={['#0a0a0a', 5, 22]} />
    </>
  )
}

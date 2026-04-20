import { useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Points, Texture } from 'three'
import {
  BufferGeometry,
  BufferAttribute,
  CanvasTexture,
  AdditiveBlending,
} from 'three'

interface DustParticlesProps {
  center: [number, number, number]
  radius: number
  count: number
  color?: string
  size?: number
  opacity?: number
}

// Generate a soft radial gradient sprite for the particle
function makeSoftDotTexture(): Texture {
  const s = 64
  const canvas = document.createElement('canvas')
  canvas.width = s
  canvas.height = s
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.5)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, s, s)
  }
  return new CanvasTexture(canvas)
}

export function DustParticles({
  center,
  radius,
  count,
  color = '#ffe0b3',
  size = 0.04,
  opacity = 0.22,
}: DustParticlesProps): ReactElement {
  const pointsRef = useRef<Points>(null)

  const [{ geometry, velocities, texture }] = useState(() => {
    const positions = new Float32Array(count * 3)
    const vels = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = center[0] + (Math.random() - 0.5) * radius * 2
      positions[i * 3 + 1] = center[1] + (Math.random() - 0.5) * radius
      positions[i * 3 + 2] = center[2] + (Math.random() - 0.5) * radius * 2
      vels[i * 3 + 0] = (Math.random() - 0.5) * 0.03
      vels[i * 3 + 1] = (Math.random() - 0.3) * 0.03
      vels[i * 3 + 2] = (Math.random() - 0.5) * 0.03
    }

    const geom = new BufferGeometry()
    geom.setAttribute('position', new BufferAttribute(positions, 3))
    return { geometry: geom, velocities: vels, texture: makeSoftDotTexture() }
  })

  useFrame((_, delta) => {
    const points = pointsRef.current
    if (!points) return
    const attr = points.geometry.getAttribute('position') as BufferAttribute
    const arr = attr.array as Float32Array

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] += velocities[i * 3 + 0] * delta
      arr[i * 3 + 1] += velocities[i * 3 + 1] * delta
      arr[i * 3 + 2] += velocities[i * 3 + 2] * delta

      const dx = arr[i * 3 + 0] - center[0]
      const dy = arr[i * 3 + 1] - center[1]
      const dz = arr[i * 3 + 2] - center[2]
      if (
        Math.abs(dx) > radius * 1.5 ||
        Math.abs(dy) > radius * 1.5 ||
        Math.abs(dz) > radius * 1.5
      ) {
        arr[i * 3 + 0] = center[0] + (Math.random() - 0.5) * radius * 2
        arr[i * 3 + 1] = center[1] + (Math.random() - 0.5) * radius
        arr[i * 3 + 2] = center[2] + (Math.random() - 0.5) * radius * 2
      }
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={color}
        size={size}
        sizeAttenuation
        transparent
        opacity={opacity}
        depthWrite={false}
        map={texture}
        alphaTest={0.01}
        blending={AdditiveBlending}
      />
    </points>
  )
}

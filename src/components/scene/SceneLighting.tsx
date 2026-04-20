import type { ReactElement } from 'react'

export function SceneLighting(): ReactElement {
  return (
    <>
      {/* Warm ambient fill */}
      <ambientLight intensity={0.15} color="#f5e6d3" />

      {/* Main key light — warm amber, from above-left */}
      <pointLight
        position={[-3, 5, 2]}
        intensity={0.8}
        color="#e67e22"
        distance={20}
        decay={2}
      />

      {/* Secondary fill — softer, from the right */}
      <pointLight
        position={[4, 3, -1]}
        intensity={0.4}
        color="#d4a574"
        distance={15}
        decay={2}
      />

      {/* Subtle backlight for depth */}
      <pointLight
        position={[0, 2, -5]}
        intensity={0.2}
        color="#a0522d"
        distance={12}
        decay={2}
      />

      {/* Dark environment — no environment map, just dark fog */}
      <fog attach="fog" args={['#0a0a0a', 8, 25]} />
    </>
  )
}

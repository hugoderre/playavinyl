import type { ReactElement } from 'react'

export function SceneLighting(): ReactElement {
  return (
    <>
      {/* Warm ambient fill */}
      <ambientLight intensity={0.45} color="#f5e6d3" />

      {/* Main key light — warm amber, from above-left */}
      <pointLight
        position={[-1.2, 1.8, 1.2]}
        intensity={18}
        color="#e67e22"
        distance={8}
        decay={2}
      />

      {/* Secondary fill — softer, from the right (over turntable) */}
      <pointLight
        position={[2.2, 1.6, 1.0]}
        intensity={14}
        color="#d4a574"
        distance={7}
        decay={2}
      />

      {/* Subtle backlight for depth */}
      <pointLight
        position={[0, 1.2, -2]}
        intensity={6}
        color="#a0522d"
        distance={6}
        decay={2}
      />

      {/* Dark environment — loose fog so objects in the 2-5m range stay visible */}
      <fog attach="fog" args={['#0a0a0a', 4, 14]} />
    </>
  )
}

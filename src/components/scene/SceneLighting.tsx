import type { ReactElement } from 'react'

export function SceneLighting(): ReactElement {
  return (
    <>
      {/* Neutral ambient fill — keeps everything readable */}
      <ambientLight intensity={0.6} color="#d8d0c4" />

      {/* Main key light — slightly warm, from above-front */}
      <pointLight
        position={[0, 2.2, 1.5]}
        intensity={14}
        color="#fff0d8"
        distance={9}
        decay={2}
      />

      {/* Left warm accent */}
      <pointLight
        position={[-2.5, 1.4, 0.8]}
        intensity={6}
        color="#e67e22"
        distance={6}
        decay={2}
      />

      {/* Right warm accent (over turntable) */}
      <pointLight
        position={[3, 1.4, 0.8]}
        intensity={8}
        color="#d4a574"
        distance={7}
        decay={2}
      />

      {/* Loose fog — objects beyond 10m fade to black */}
      <fog attach="fog" args={['#0a0a0a', 5, 18]} />
    </>
  )
}

import React from 'react'

export default function App(): React.ReactElement {
  return (
    <div className="relative w-full h-full">
      {/* R3F Canvas will go here */}
      <div className="absolute inset-0 bg-[var(--color-bg)] flex items-center justify-center">
        <p className="text-[var(--color-text-muted)] text-lg">Play a Vinyl</p>
      </div>
    </div>
  )
}

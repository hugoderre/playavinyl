import { useEffect, useMemo, useState } from 'react'

type RGB = [number, number, number]

const cache = new Map<string, RGB>()

export function useDominantColor(imageUrl: string | undefined): RGB | null {
  const [tick, setTick] = useState(0)

  const color = useMemo<RGB | null>(() => {
    if (!imageUrl) return null
    return cache.get(imageUrl) ?? null
    // tick is intentionally included — reading cache after a load bumps it
  }, [imageUrl, tick])

  useEffect(() => {
    if (!imageUrl || cache.has(imageUrl)) return

    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = (): void => {
      if (cancelled) return
      const canvas = document.createElement('canvas')
      const size = 16
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0, size, size)
      const { data } = ctx.getImageData(0, 0, size, size)

      let sumR = 0
      let sumG = 0
      let sumB = 0
      let totalWeight = 0
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const lightness = (max + min) / 2
        const saturation = max === min ? 0 : (max - min) / 255
        if (lightness < 20 || lightness > 235) continue
        const weight = 1 + saturation * 3
        sumR += r * weight
        sumG += g * weight
        sumB += b * weight
        totalWeight += weight
      }

      if (totalWeight === 0) return
      const rgb: RGB = [
        Math.round(sumR / totalWeight),
        Math.round(sumG / totalWeight),
        Math.round(sumB / totalWeight),
      ]
      cache.set(imageUrl, rgb)
      setTick((t) => t + 1)
    }
    img.src = imageUrl

    return () => {
      cancelled = true
    }
  }, [imageUrl])

  return color
}

export function rgbToHex(rgb: RGB): string {
  const hex = (n: number): string => n.toString(16).padStart(2, '0')
  return `#${hex(rgb[0])}${hex(rgb[1])}${hex(rgb[2])}`
}

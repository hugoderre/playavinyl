import { useEffect, useRef } from 'react'
import { searchTracks, getChartTracks, getAlbumTracks } from '../api/deezer'
import type { DeezerTrack } from '../types'

export function useDeezerSearch(
  query: string,
  onResults: (tracks: DeezerTrack[]) => void,
  onLoading: (loading: boolean) => void,
): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (!query.trim()) return

    onLoading(true)

    timeoutRef.current = setTimeout(async () => {
      const results = await searchTracks(query)
      onResults(results)
      onLoading(false)
    }, 300)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [query, onResults, onLoading])
}

export function useChartTracks(onResults: (tracks: DeezerTrack[]) => void): void {
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true

    getChartTracks().then(onResults)
  }, [onResults])
}

export { getAlbumTracks }

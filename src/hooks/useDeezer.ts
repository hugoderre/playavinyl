import { useEffect, useRef } from 'react'
import { searchTracks, getChartTracks, getAlbumTracks } from '../api/deezer'
import type { DeezerTrack } from '../types'
import { useSceneStore } from '../stores/sceneStore'
import { useSearchStore } from '../stores/searchStore'

const PAGE_SIZE = 25
const PREFETCH_THRESHOLD = 8

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

export function useFetchMoreTracks(): void {
  const tracks = useSceneStore((s) => s.tracks)
  const scrollPosition = useSceneStore((s) => s.scrollPosition)
  const isFetchingMore = useSceneStore((s) => s.isFetchingMore)
  const hasMore = useSceneStore((s) => s.hasMore)
  const mode = useSceneStore((s) => s.mode)
  const appendTracks = useSceneStore((s) => s.appendTracks)
  const setFetchingMore = useSceneStore((s) => s.setFetchingMore)
  const setHasMore = useSceneStore((s) => s.setHasMore)
  const query = useSearchStore((s) => s.query)

  useEffect(() => {
    if (tracks.length === 0 || isFetchingMore || !hasMore) return
    if (scrollPosition < tracks.length - PREFETCH_THRESHOLD) return

    setFetchingMore(true)
    const offset = tracks.length

    const promise = mode === 'charts'
      ? getChartTracks(PAGE_SIZE, offset)
      : searchTracks(query, PAGE_SIZE, offset)

    promise
      .then((newTracks) => {
        if (newTracks.length < PAGE_SIZE) setHasMore(false)
        if (newTracks.length > 0) appendTracks(newTracks)
        setFetchingMore(false)
      })
      .catch(() => setFetchingMore(false))
  }, [scrollPosition, tracks.length, isFetchingMore, hasMore, mode, query, appendTracks, setFetchingMore, setHasMore])
}

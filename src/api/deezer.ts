import type { DeezerSearchResponse, DeezerChartTracksResponse, DeezerTrack } from '../types'

const PROXY = '/api/deezer'

const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function buildUrl(deezerPath: string, params: Record<string, string> = {}): string {
  const search = new URLSearchParams({ path: deezerPath, ...params })
  return `${PROXY}?${search}`
}

async function fetchCached<T>(url: string): Promise<T> {
  const cached = cache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Deezer API error: ${response.status}`)
  }

  const data = await response.json() as T
  cache.set(url, { data, timestamp: Date.now() })
  return data
}

export async function searchTracks(query: string, limit = 25): Promise<DeezerTrack[]> {
  const result = await fetchCached<DeezerSearchResponse>(
    buildUrl('search', { q: query, limit: String(limit) }),
  )
  return result.data
}

export async function getChartTracks(limit = 50): Promise<DeezerTrack[]> {
  const result = await fetchCached<DeezerChartTracksResponse>(
    buildUrl('chart/0/tracks', { limit: String(limit) }),
  )
  return result.data
}

export async function getAlbumTracks(albumId: number): Promise<DeezerTrack[]> {
  const result = await fetchCached<{ data: DeezerTrack[] }>(
    buildUrl(`album/${albumId}/tracks`),
  )
  return result.data
}

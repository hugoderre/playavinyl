import type { DeezerSearchResponse, DeezerChartTracksResponse, DeezerTrack } from '../types'

const BASE = '/api/deezer'

const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

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
  const params = new URLSearchParams({ q: query, limit: String(limit) })
  const result = await fetchCached<DeezerSearchResponse>(`${BASE}/search?${params}`)
  return result.data
}

export async function getChartTracks(limit = 50): Promise<DeezerTrack[]> {
  const result = await fetchCached<DeezerChartTracksResponse>(`${BASE}/chart/0/tracks?limit=${limit}`)
  return result.data
}

export async function getAlbumTracks(albumId: number): Promise<DeezerTrack[]> {
  const result = await fetchCached<{ data: DeezerTrack[] }>(`${BASE}/album/${albumId}/tracks`)
  return result.data
}

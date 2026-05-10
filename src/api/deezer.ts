import type { DeezerSearchResponse, DeezerChartTracksResponse, DeezerTrack } from '../types'

const PROXY = '/api/deezer'

const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function buildUrl(deezerPath: string, params: Record<string, string> = {}): string {
  const search = new URLSearchParams({ path: deezerPath, ...params })
  return `${PROXY}?${search}`
}

// Deezer renvoie occasionnellement des tracks sans pochette (cover_big null).
// Sans cover on ne peut ni afficher la jaquette, ni extraire la couleur dominante,
// donc on les écarte à la frontière API — le reste du code suppose une URL valide.
function hasCover(track: DeezerTrack): boolean {
  return Boolean(track?.album?.cover_big)
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

export async function searchTracks(query: string, limit = 25, index = 0): Promise<DeezerTrack[]> {
  const result = await fetchCached<DeezerSearchResponse>(
    buildUrl('search', { q: query, limit: String(limit), index: String(index) }),
  )
  return result.data.filter(hasCover)
}

export async function getChartTracks(limit = 50, index = 0): Promise<DeezerTrack[]> {
  const result = await fetchCached<DeezerChartTracksResponse>(
    buildUrl('chart/0/tracks', { limit: String(limit), index: String(index) }),
  )
  return result.data.filter(hasCover)
}

export async function getAlbumTracks(albumId: number): Promise<DeezerTrack[]> {
  const result = await fetchCached<{ data: DeezerTrack[] }>(
    buildUrl(`album/${albumId}/tracks`),
  )
  return result.data.filter(hasCover)
}

export async function getGenreTracks(genreId: number, limit = 50, index = 0): Promise<DeezerTrack[]> {
  const path = genreId === 0 ? 'chart/0/tracks' : `chart/${genreId}/tracks`
  const result = await fetchCached<DeezerChartTracksResponse>(
    buildUrl(path, { limit: String(limit), index: String(index) }),
  )
  return result.data.filter(hasCover)
}

export async function getTrack(trackId: number): Promise<DeezerTrack | null> {
  try {
    const track = await fetchCached<DeezerTrack>(buildUrl(`track/${trackId}`))
    return hasCover(track) ? track : null
  } catch {
    return null
  }
}

export async function getArtistRadio(artistId: number, limit = 25): Promise<DeezerTrack[]> {
  const result = await fetchCached<{ data: DeezerTrack[] }>(
    buildUrl(`artist/${artistId}/radio`, { limit: String(limit) }),
  )
  return result.data.filter(hasCover)
}

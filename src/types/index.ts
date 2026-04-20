export interface DeezerArtist {
  id: number
  name: string
  picture_medium: string
  picture_big: string
}

export interface DeezerAlbum {
  id: number
  title: string
  cover_medium: string
  cover_big: string
  cover_xl: string
  release_date?: string
}

export interface DeezerTrack {
  id: number
  title: string
  title_short: string
  duration: number
  preview: string
  link: string
  artist: DeezerArtist
  album: DeezerAlbum
}

export interface DeezerSearchResponse {
  data: DeezerTrack[]
  total: number
  next?: string
}

export interface DeezerChartTracksResponse {
  data: DeezerTrack[]
  total: number
}

export type SceneState = 'browsing' | 'animating' | 'playing'

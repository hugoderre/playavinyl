# Play a Vinyl — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full 3D vinyl browsing and playback experience — users scroll through a vinyl shelf, click a record, watch it animate onto a turntable, and listen to a 30-second Deezer preview.

**Architecture:** Single R3F Canvas scene with three states (browsing/animating/playing). Zustand stores manage scene state, player state, and search state. Deezer API calls go through a Vercel serverless proxy for JSON, while covers and audio previews are loaded directly from Deezer CDN.

**Tech Stack:** React 19, TypeScript, Three.js via @react-three/fiber + @react-three/drei, Zustand, Tailwind CSS v4, Vite 8, Vercel serverless functions.

---

## File Map

### New Files

| Path | Responsibility |
|---|---|
| `src/types/index.ts` | Shared TypeScript types (Track, Album, Artist, SceneState) |
| `src/stores/playerStore.ts` | Audio playback state (current track, playing, progress) |
| `src/stores/sceneStore.ts` | Scene state machine (browsing/animating/playing, scroll, selected vinyl) |
| `src/stores/searchStore.ts` | Search query, results, loading |
| `src/api/deezer.ts` | Deezer API client with caching and debounce |
| `src/hooks/useAudio.ts` | HTMLAudioElement management, play/pause/progress |
| `src/hooks/useDeezer.ts` | React hook wrapping the API client |
| `src/hooks/useVinylAnimation.ts` | Orchestrates vinyl selection animation sequence |
| `src/components/scene/SceneLighting.tsx` | Warm ambient lighting setup |
| `src/components/scene/VinylRecord.tsx` | Single vinyl: sleeve + disc geometry |
| `src/components/scene/VinylShelf.tsx` | Shelf furniture + vinyl instances + scroll |
| `src/components/scene/Turntable.tsx` | Turntable geometry + spin/tonearm animations |
| `src/components/scene/SceneManager.tsx` | Camera control + state-driven scene orchestration |
| `src/components/ui/SearchBar.tsx` | Overlay search bar with debounce |
| `src/components/ui/TrackInfoPanel.tsx` | Right-side transparent panel during playback |
| `src/components/ui/VinylHoverInfo.tsx` | Tooltip on hover in browsing mode |
| `api/deezer/[...path].ts` | Vercel serverless proxy for Deezer API |

### Files to Replace

| Path | Change |
|---|---|
| `src/App.tsx` | Replace Vite template with R3F Canvas + UI overlays |
| `src/App.css` | Delete (replaced by Tailwind) |
| `src/index.css` | Replace with Tailwind import + minimal global styles |

---

## Task 1: Project Cleanup & Tailwind Setup

**Files:**
- Delete: `src/App.css`
- Modify: `src/index.css`
- Modify: `src/App.tsx`
- Delete: `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png`

- [ ] **Step 1: Remove Vite template files**

Delete the template assets and App.css:

```bash
rm src/App.css src/assets/react.svg src/assets/vite.svg src/assets/hero.png
```

- [ ] **Step 2: Replace index.css with Tailwind + global styles**

Replace `src/index.css` with:

```css
@import "tailwindcss";

:root {
  --color-bg: #0a0a0a;
  --color-text: #f5f0e8;
  --color-text-muted: #a89f95;
  --color-accent: #e67e22;
  --color-accent-dark: #d35400;
  --color-surface: rgba(255, 255, 255, 0.06);
  --color-border: rgba(255, 255, 255, 0.08);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
}

#root {
  width: 100%;
  height: 100%;
}
```

- [ ] **Step 3: Replace App.tsx with minimal shell**

Replace `src/App.tsx` with:

```tsx
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
```

- [ ] **Step 4: Verify the app runs**

Run: `yarn dev`

Open `http://localhost:5173` — should show "Play a Vinyl" centered on dark background. No errors in console.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove Vite template, setup Tailwind and app shell"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create the types file**

Create `src/types/index.ts`:

```ts
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
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Deezer API and scene TypeScript types"
```

---

## Task 3: Deezer Serverless Proxy

**Files:**
- Create: `api/deezer/[...path].ts`

- [ ] **Step 1: Create the proxy function**

Create `api/deezer/[...path].ts`:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

const DEEZER_BASE = 'https://api.deezer.com'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const { path } = req.query
  const segments = Array.isArray(path) ? path.join('/') : (path ?? '')

  const url = new URL(`/${segments}`, DEEZER_BASE)

  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue
    if (typeof value === 'string') {
      url.searchParams.set(key, value)
    }
  }

  const response = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
  })

  const data = await response.json()

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
  res.status(response.status).json(data)
}
```

- [ ] **Step 2: Install @vercel/node types**

```bash
yarn add -D @vercel/node
```

- [ ] **Step 3: Create vercel.json for local dev routing**

Create `vercel.json` at project root:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

- [ ] **Step 4: Test the proxy locally**

Run: `vercel dev`

Then in another terminal:

```bash
curl -s 'http://localhost:3000/api/deezer/search?q=daft+punk&limit=1' | python3 -m json.tool | head -20
```

Expected: JSON response with Deezer search results.

- [ ] **Step 5: Commit**

```bash
git add api/deezer/\[\...path\].ts vercel.json
git commit -m "feat: add Vercel serverless proxy for Deezer API"
```

---

## Task 4: Deezer API Client & Hook

**Files:**
- Create: `src/api/deezer.ts`
- Create: `src/hooks/useDeezer.ts`

- [ ] **Step 1: Create the API client with caching**

Create `src/api/deezer.ts`:

```ts
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
```

- [ ] **Step 2: Create the React hook**

Create `src/hooks/useDeezer.ts`:

```ts
import { useEffect, useRef, useCallback } from 'react'
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
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/api/deezer.ts src/hooks/useDeezer.ts
git commit -m "feat: add Deezer API client with caching and React hooks"
```

---

## Task 5: Zustand Stores

**Files:**
- Create: `src/stores/sceneStore.ts`
- Create: `src/stores/playerStore.ts`
- Create: `src/stores/searchStore.ts`

- [ ] **Step 1: Create sceneStore**

Create `src/stores/sceneStore.ts`:

```ts
import { create } from 'zustand'
import type { SceneState, DeezerTrack } from '../types'

interface SceneStoreState {
  state: SceneState
  scrollPosition: number
  selectedVinylId: number | null
  tracks: DeezerTrack[]
  albumTracks: DeezerTrack[]

  setState: (state: SceneState) => void
  setScrollPosition: (position: number) => void
  selectVinyl: (trackId: number) => void
  clearSelection: () => void
  setTracks: (tracks: DeezerTrack[]) => void
  setAlbumTracks: (tracks: DeezerTrack[]) => void
}

export const useSceneStore = create<SceneStoreState>((set) => ({
  state: 'browsing',
  scrollPosition: 0,
  selectedVinylId: null,
  tracks: [],
  albumTracks: [],

  setState: (state) => set({ state }),
  setScrollPosition: (scrollPosition) => set({ scrollPosition }),
  selectVinyl: (trackId) => set({ selectedVinylId: trackId, state: 'animating' }),
  clearSelection: () => set({ selectedVinylId: null, state: 'browsing', albumTracks: [] }),
  setTracks: (tracks) => set({ tracks }),
  setAlbumTracks: (albumTracks) => set({ albumTracks }),
}))
```

- [ ] **Step 2: Create playerStore**

Create `src/stores/playerStore.ts`:

```ts
import { create } from 'zustand'
import type { DeezerTrack } from '../types'

interface PlayerStoreState {
  currentTrack: DeezerTrack | null
  isPlaying: boolean
  progress: number

  play: (track: DeezerTrack) => void
  stop: () => void
  setProgress: (progress: number) => void
}

export const usePlayerStore = create<PlayerStoreState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  progress: 0,

  play: (track) => set({ currentTrack: track, isPlaying: true, progress: 0 }),
  stop: () => set({ isPlaying: false, progress: 0 }),
  setProgress: (progress) => set({ progress }),
}))
```

- [ ] **Step 3: Create searchStore**

Create `src/stores/searchStore.ts`:

```ts
import { create } from 'zustand'
import type { DeezerTrack } from '../types'

interface SearchStoreState {
  query: string
  results: DeezerTrack[]
  isLoading: boolean
  isSearchActive: boolean

  setQuery: (query: string) => void
  setResults: (results: DeezerTrack[]) => void
  setLoading: (loading: boolean) => void
  clearSearch: () => void
}

export const useSearchStore = create<SearchStoreState>((set) => ({
  query: '',
  results: [],
  isLoading: false,
  isSearchActive: false,

  setQuery: (query) => set({ query, isSearchActive: query.length > 0 }),
  setResults: (results) => set({ results }),
  setLoading: (isLoading) => set({ isLoading }),
  clearSearch: () => set({ query: '', results: [], isSearchActive: false, isLoading: false }),
}))
```

- [ ] **Step 4: Verify types compile**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/stores/
git commit -m "feat: add Zustand stores for scene, player, and search state"
```

---

## Task 6: Audio Hook

**Files:**
- Create: `src/hooks/useAudio.ts`

- [ ] **Step 1: Create the audio hook**

Create `src/hooks/useAudio.ts`:

```ts
import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '../stores/playerStore'
import { useSceneStore } from '../stores/sceneStore'

export function useAudio(): {
  playPreview: (previewUrl: string) => void
  stopPlayback: () => void
} {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animFrameRef = useRef<number>(0)
  const setProgress = usePlayerStore((s) => s.setProgress)
  const stop = usePlayerStore((s) => s.stop)
  const sceneSetState = useSceneStore((s) => s.setState)

  const updateProgress = useCallback(() => {
    const audio = audioRef.current
    if (!audio || audio.paused) return

    setProgress(audio.currentTime)
    animFrameRef.current = requestAnimationFrame(updateProgress)
  }, [setProgress])

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    cancelAnimationFrame(animFrameRef.current)
    stop()
  }, [stop])

  const playPreview = useCallback((previewUrl: string) => {
    stopPlayback()

    const audio = new Audio(previewUrl)
    audioRef.current = audio

    audio.addEventListener('ended', () => {
      cancelAnimationFrame(animFrameRef.current)
      stop()
      sceneSetState('playing') // Stay on turntable view, just stopped
    })

    audio.play()
    animFrameRef.current = requestAnimationFrame(updateProgress)
  }, [stopPlayback, stop, updateProgress, sceneSetState])

  useEffect(() => {
    return () => {
      stopPlayback()
    }
  }, [stopPlayback])

  return { playPreview, stopPlayback }
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAudio.ts
git commit -m "feat: add useAudio hook for preview playback"
```

---

## Task 7: Scene Lighting

**Files:**
- Create: `src/components/scene/SceneLighting.tsx`

- [ ] **Step 1: Create the lighting component**

Create `src/components/scene/SceneLighting.tsx`:

```tsx
export function SceneLighting(): React.ReactElement {
  return (
    <>
      {/* Warm ambient fill */}
      <ambientLight intensity={0.15} color="#f5e6d3" />

      {/* Main key light — warm amber, from above-left */}
      <pointLight
        position={[-3, 5, 2]}
        intensity={0.8}
        color="#e67e22"
        distance={20}
        decay={2}
      />

      {/* Secondary fill — softer, from the right */}
      <pointLight
        position={[4, 3, -1]}
        intensity={0.4}
        color="#d4a574"
        distance={15}
        decay={2}
      />

      {/* Subtle backlight for depth */}
      <pointLight
        position={[0, 2, -5]}
        intensity={0.2}
        color="#a0522d"
        distance={12}
        decay={2}
      />

      {/* Dark environment — no environment map, just dark fog */}
      <fog attach="fog" args={['#0a0a0a', 8, 25]} />
    </>
  )
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/scene/SceneLighting.tsx
git commit -m "feat: add warm ambient scene lighting"
```

---

## Task 8: VinylRecord 3D Component

**Files:**
- Create: `src/components/scene/VinylRecord.tsx`

- [ ] **Step 1: Create the vinyl record component**

This component renders a single vinyl: a square sleeve with an album cover texture and a round disc that peeks out on hover.

Create `src/components/scene/VinylRecord.tsx`:

```tsx
import { useRef, useState } from 'react'
import { useLoader } from '@react-three/fiber'
import { TextureLoader, type Mesh, type Group, DoubleSide } from 'three'
import type { DeezerTrack } from '../../types'

interface VinylRecordProps {
  track: DeezerTrack
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  onClick?: () => void
  onPointerEnter?: () => void
  onPointerLeave?: () => void
}

const SLEEVE_SIZE = 0.31 // ~31cm vinyl sleeve
const DISC_RADIUS = 0.15
const DISC_THICKNESS = 0.003

export function VinylRecord({
  track,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  onClick,
  onPointerEnter,
  onPointerLeave,
}: VinylRecordProps): React.ReactElement {
  const groupRef = useRef<Group>(null)
  const discRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const coverTexture = useLoader(TextureLoader, track.album.cover_medium)

  const handlePointerEnter = (): void => {
    setHovered(true)
    onPointerEnter?.()
    document.body.style.cursor = 'pointer'
  }

  const handlePointerLeave = (): void => {
    setHovered(false)
    onPointerLeave?.()
    document.body.style.cursor = 'default'
  }

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      {/* Sleeve — square box with cover art */}
      <mesh
        onClick={onClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <boxGeometry args={[SLEEVE_SIZE, SLEEVE_SIZE, 0.005]} />
        <meshStandardMaterial
          map={coverTexture}
          side={DoubleSide}
          roughness={0.7}
          metalness={0.0}
        />
      </mesh>

      {/* Disc — peeking out to the right on hover */}
      <mesh
        ref={discRef}
        position={[hovered ? SLEEVE_SIZE * 0.3 : 0, 0, -0.001]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[DISC_RADIUS, DISC_RADIUS, DISC_THICKNESS, 64]} />
        <meshStandardMaterial
          color="#111111"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Disc center label */}
      <mesh
        position={[hovered ? SLEEVE_SIZE * 0.3 : 0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.04, 0.04, DISC_THICKNESS + 0.001, 32]} />
        <meshStandardMaterial
          map={coverTexture}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/scene/VinylRecord.tsx
git commit -m "feat: add VinylRecord 3D component with sleeve and disc"
```

---

## Task 9: VinylShelf 3D Component

**Files:**
- Create: `src/components/scene/VinylShelf.tsx`

- [ ] **Step 1: Create the shelf component**

The shelf is a wooden furniture piece containing vinyl records arranged in a perspective line. Scroll moves through the vinyls.

Create `src/components/scene/VinylShelf.tsx`:

```tsx
import { useRef, useCallback, useEffect, Suspense } from 'react'
import { useThree } from '@react-three/fiber'
import type { Group } from 'three'
import { VinylRecord } from './VinylRecord'
import { useSceneStore } from '../../stores/sceneStore'
import type { DeezerTrack } from '../../types'

const VINYL_SPACING = 0.02 // gap between vinyls in the shelf
const VISIBLE_COUNT = 20

export function VinylShelf(): React.ReactElement {
  const groupRef = useRef<Group>(null)
  const tracks = useSceneStore((s) => s.tracks)
  const scrollPosition = useSceneStore((s) => s.scrollPosition)
  const setScrollPosition = useSceneStore((s) => s.setScrollPosition)
  const selectVinyl = useSceneStore((s) => s.selectVinyl)
  const sceneState = useSceneStore((s) => s.state)
  const { gl } = useThree()

  // Scroll handler
  useEffect(() => {
    if (sceneState !== 'browsing') return

    const canvas = gl.domElement
    const handleWheel = (e: WheelEvent): void => {
      e.preventDefault()
      const delta = e.deltaY * 0.003
      const maxScroll = Math.max(0, tracks.length - 1)
      setScrollPosition(Math.max(0, Math.min(maxScroll, scrollPosition + delta)))
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [gl, scrollPosition, setScrollPosition, tracks.length, sceneState])

  const handleVinylClick = useCallback((track: DeezerTrack) => {
    if (sceneState === 'browsing') {
      selectVinyl(track.id)
    }
  }, [selectVinyl, sceneState])

  // Calculate visible vinyls based on scroll position
  const startIdx = Math.max(0, Math.floor(scrollPosition) - 1)
  const endIdx = Math.min(tracks.length, startIdx + VISIBLE_COUNT)
  const visibleTracks = tracks.slice(startIdx, endIdx)

  return (
    <group ref={groupRef}>
      {/* Shelf furniture — simple box for now, will be refined */}
      {/* Bottom shelf board */}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[0.6, 0.02, 0.35]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Back board */}
      <mesh position={[0, 0, -0.17]}>
        <boxGeometry args={[0.6, 0.45, 0.01]} />
        <meshStandardMaterial color="#4a2e14" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Left side */}
      <mesh position={[-0.3, 0, 0]}>
        <boxGeometry args={[0.015, 0.45, 0.35]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Right side (extends further to suggest depth) */}
      <mesh position={[0.3, 0, 0]}>
        <boxGeometry args={[0.015, 0.45, 0.35]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Legs */}
      {[[-0.28, -0.35, 0.14], [0.28, -0.35, 0.14], [-0.28, -0.35, -0.14], [0.28, -0.35, -0.14]].map(
        (pos, i) => (
          <mesh key={i} position={pos as [number, number, number]}>
            <cylinderGeometry args={[0.01, 0.012, 0.12, 8]} />
            <meshStandardMaterial color="#3d2510" roughness={0.9} metalness={0.05} />
          </mesh>
        ),
      )}

      {/* Vinyl records inside the shelf */}
      <Suspense fallback={null}>
        {visibleTracks.map((track, i) => {
          const globalIdx = startIdx + i
          const offset = globalIdx - scrollPosition

          // Position vinyls along Z axis (depth), tilted slightly
          const z = offset * (SLEEVE_SIZE_APPROX + VINYL_SPACING)
          const opacity = offset < 0 ? Math.max(0, 1 + offset) : 1

          return (
            <VinylRecord
              key={track.id}
              track={track}
              position={[0, 0, z * -1]}
              rotation={[0, 0, 0]}
              scale={opacity > 0.1 ? 1 : 0}
              onClick={() => handleVinylClick(track)}
            />
          )
        })}
      </Suspense>
    </group>
  )
}

const SLEEVE_SIZE_APPROX = 0.31
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/scene/VinylShelf.tsx
git commit -m "feat: add VinylShelf 3D component with scroll navigation"
```

---

## Task 10: Turntable 3D Component

**Files:**
- Create: `src/components/scene/Turntable.tsx`

- [ ] **Step 1: Create the turntable component**

Create `src/components/scene/Turntable.tsx`:

```tsx
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh, Group } from 'three'
import { usePlayerStore } from '../../stores/playerStore'

const PLATTER_RADIUS = 0.15
const BASE_WIDTH = 0.45
const BASE_DEPTH = 0.35
const BASE_HEIGHT = 0.04
const RPM = 33.33
const RADIANS_PER_SECOND = (RPM / 60) * Math.PI * 2

export function Turntable(): React.ReactElement {
  const platterRef = useRef<Mesh>(null)
  const tonearmRef = useRef<Group>(null)
  const isPlaying = usePlayerStore((s) => s.isPlaying)

  useFrame((_, delta) => {
    // Spin the platter when playing
    if (platterRef.current && isPlaying) {
      platterRef.current.rotation.y += RADIANS_PER_SECOND * delta
    }

    // Tonearm position
    if (tonearmRef.current) {
      const targetRotation = isPlaying ? -0.15 : 0.3
      tonearmRef.current.rotation.y += (targetRotation - tonearmRef.current.rotation.y) * 0.05
    }
  })

  return (
    <group position={[2, 0, 0]}>
      {/* Base / plinth */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[BASE_WIDTH, BASE_HEIGHT, BASE_DEPTH]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Platter */}
      <mesh ref={platterRef} position={[0, 0.01, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[PLATTER_RADIUS, PLATTER_RADIUS, 0.008, 64]} />
        <meshStandardMaterial color="#222222" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Platter center spindle */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.015, 16]} />
        <meshStandardMaterial color="#888888" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Tonearm assembly */}
      <group ref={tonearmRef} position={[0.18, 0.025, -0.1]}>
        {/* Pivot base */}
        <mesh>
          <cylinderGeometry args={[0.012, 0.012, 0.02, 16]} />
          <meshStandardMaterial color="#333333" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Arm */}
        <mesh position={[-0.1, 0.01, 0.08]} rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.005, 0.005, 0.2]} />
          <meshStandardMaterial color="#666666" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Headshell / cartridge */}
        <mesh position={[-0.14, 0.008, 0.17]} rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.015, 0.008, 0.025]} />
          <meshStandardMaterial color="#444444" roughness={0.4} metalness={0.7} />
        </mesh>
      </group>

      {/* Power button indicator */}
      <mesh position={[0.18, 0.025, 0.14]}>
        <sphereGeometry args={[0.005, 16, 16]} />
        <meshStandardMaterial
          color={isPlaying ? '#e67e22' : '#333333'}
          emissive={isPlaying ? '#e67e22' : '#000000'}
          emissiveIntensity={isPlaying ? 0.5 : 0}
        />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/scene/Turntable.tsx
git commit -m "feat: add Turntable 3D component with spinning platter and tonearm"
```

---

## Task 11: Scene Manager & Camera

**Files:**
- Create: `src/components/scene/SceneManager.tsx`

- [ ] **Step 1: Create the scene manager**

This component orchestrates camera position based on scene state.

Create `src/components/scene/SceneManager.tsx`:

```tsx
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useSceneStore } from '../../stores/sceneStore'

const CAMERA_POSITIONS = {
  browsing: new Vector3(0, 0.3, 1.5),
  animating: new Vector3(1, 0.3, 1),
  playing: new Vector3(2, 0.4, 1.2),
} as const

const CAMERA_LOOK_AT = {
  browsing: new Vector3(0, 0, -0.5),
  animating: new Vector3(1, 0, 0),
  playing: new Vector3(2, 0, 0),
} as const

const LERP_SPEED = 0.03

export function SceneManager(): React.ReactElement | null {
  const sceneState = useSceneStore((s) => s.state)
  const targetPos = useRef(CAMERA_POSITIONS.browsing.clone())
  const targetLookAt = useRef(CAMERA_LOOK_AT.browsing.clone())
  const currentLookAt = useRef(CAMERA_LOOK_AT.browsing.clone())
  const { camera } = useThree()

  useFrame(() => {
    const target = CAMERA_POSITIONS[sceneState]
    const lookAt = CAMERA_LOOK_AT[sceneState]

    targetPos.current.copy(target)
    targetLookAt.current.copy(lookAt)

    // Smooth camera movement
    camera.position.lerp(targetPos.current, LERP_SPEED)
    currentLookAt.current.lerp(targetLookAt.current, LERP_SPEED)
    camera.lookAt(currentLookAt.current)
  })

  return null
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/scene/SceneManager.tsx
git commit -m "feat: add SceneManager for state-driven camera transitions"
```

---

## Task 12: Wire Up App.tsx with R3F Canvas

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace App.tsx with R3F scene + UI overlay shell**

Replace `src/App.tsx` with:

```tsx
import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback } from 'react'
import { SceneLighting } from './components/scene/SceneLighting'
import { VinylShelf } from './components/scene/VinylShelf'
import { Turntable } from './components/scene/Turntable'
import { SceneManager } from './components/scene/SceneManager'
import { useSceneStore } from './stores/sceneStore'
import { useChartTracks } from './hooks/useDeezer'

export default function App(): React.ReactElement {
  const setTracks = useSceneStore((s) => s.setTracks)

  const handleChartTracks = useCallback((tracks: Parameters<typeof setTracks>[0]) => {
    setTracks(tracks)
  }, [setTracks])

  useChartTracks(handleChartTracks)

  return (
    <div className="relative w-full h-full">
      {/* 3D Scene */}
      <Canvas
        camera={{ position: [0, 0.3, 1.5], fov: 50 }}
        className="absolute inset-0"
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0a0a0a')
        }}
      >
        <SceneManager />
        <SceneLighting />
        <Suspense fallback={null}>
          <VinylShelf />
        </Suspense>
        <Turntable />
      </Canvas>

      {/* UI Overlays will be added in Tasks 13-15 */}
    </div>
  )
}
```

- [ ] **Step 2: Verify the app runs**

Run: `yarn dev`

Open `http://localhost:5173` — should show the 3D scene with the shelf (furniture geometry visible), turntable on the right, and warm lighting. If tracks load from Deezer proxy, vinyl covers should appear in the shelf.

Note: this step requires the Deezer proxy to be running (`vercel dev`) or the chart request will fail silently. For dev without proxy, the shelf will be empty but the 3D scene should render.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up R3F Canvas with shelf, turntable, and scene manager"
```

---

## Task 13: SearchBar UI Component

**Files:**
- Create: `src/components/ui/SearchBar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create the search bar component**

Create `src/components/ui/SearchBar.tsx`:

```tsx
import { useCallback } from 'react'
import { useSearchStore } from '../../stores/searchStore'
import { useSceneStore } from '../../stores/sceneStore'
import { useDeezerSearch } from '../../hooks/useDeezer'

export function SearchBar(): React.ReactElement {
  const query = useSearchStore((s) => s.query)
  const setQuery = useSearchStore((s) => s.setQuery)
  const setResults = useSearchStore((s) => s.setResults)
  const setLoading = useSearchStore((s) => s.setLoading)
  const clearSearch = useSearchStore((s) => s.clearSearch)
  const setTracks = useSceneStore((s) => s.setTracks)
  const isLoading = useSearchStore((s) => s.isLoading)

  const handleResults = useCallback((tracks: Parameters<typeof setResults>[0]) => {
    setResults(tracks)
    setTracks(tracks)
  }, [setResults, setTracks])

  useDeezerSearch(query, handleResults, setLoading)

  const handleClear = (): void => {
    clearSearch()
    // Trending will reload via useChartTracks in App
  }

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un artiste, un titre..."
          className="w-full h-11 px-5 pr-10 rounded-full
            bg-[var(--color-surface)] backdrop-blur-md
            border border-[var(--color-border)]
            text-[var(--color-text)] text-sm
            placeholder:text-[var(--color-text-muted)]
            outline-none focus:border-[var(--color-accent)]
            transition-colors"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {query && !isLoading && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add SearchBar to App.tsx**

In `src/App.tsx`, add the import and render the SearchBar after the Canvas:

```tsx
import { SearchBar } from './components/ui/SearchBar'
```

Add inside the outer `<div>`, after `</Canvas>`:

```tsx
      {/* UI Overlays */}
      <SearchBar />
```

- [ ] **Step 3: Verify visually**

Run: `yarn dev`

The search bar should float at the top center of the screen, above the 3D scene. Typing should trigger a search (if proxy is running).

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/SearchBar.tsx src/App.tsx
git commit -m "feat: add SearchBar overlay with debounced Deezer search"
```

---

## Task 14: TrackInfoPanel UI Component

**Files:**
- Create: `src/components/ui/TrackInfoPanel.tsx`
- Create: `src/utils/formatters.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create formatters utility**

Create `src/utils/formatters.ts`:

```ts
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatProgress(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
```

- [ ] **Step 2: Create the track info panel**

Create `src/components/ui/TrackInfoPanel.tsx`:

```tsx
import { useCallback, useEffect } from 'react'
import { usePlayerStore } from '../../stores/playerStore'
import { useSceneStore } from '../../stores/sceneStore'
import { getAlbumTracks } from '../../hooks/useDeezer'
import { formatDuration, formatProgress } from '../../utils/formatters'
import type { DeezerTrack } from '../../types'

export function TrackInfoPanel(): React.ReactElement | null {
  const sceneState = useSceneStore((s) => s.state)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const progress = usePlayerStore((s) => s.progress)
  const albumTracks = useSceneStore((s) => s.albumTracks)
  const setAlbumTracks = useSceneStore((s) => s.setAlbumTracks)
  const selectVinyl = useSceneStore((s) => s.selectVinyl)

  // Load album tracks when a track is playing
  useEffect(() => {
    if (!currentTrack) return
    getAlbumTracks(currentTrack.album.id).then(setAlbumTracks)
  }, [currentTrack?.album.id, setAlbumTracks, currentTrack])

  const handleTrackClick = useCallback((track: DeezerTrack) => {
    selectVinyl(track.id)
  }, [selectVinyl])

  if (sceneState !== 'playing' || !currentTrack) return null

  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 z-50 w-80">
      <div className="bg-black/60 backdrop-blur-lg rounded-2xl border border-[var(--color-border)] p-6">
        {/* Cover art */}
        <img
          src={currentTrack.album.cover_big}
          alt={currentTrack.album.title}
          className="w-full aspect-square rounded-lg mb-4 object-cover"
          crossOrigin="anonymous"
        />

        {/* Track info */}
        <h2 className="text-[var(--color-text)] text-lg font-semibold leading-tight">
          {currentTrack.title_short}
        </h2>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">
          {currentTrack.artist.name}
        </p>
        <p className="text-[var(--color-text-muted)] text-xs mt-0.5 opacity-60">
          {currentTrack.album.title}
          {currentTrack.album.release_date && ` · ${currentTrack.album.release_date.slice(0, 4)}`}
        </p>

        {/* Duration */}
        <p className="text-[var(--color-text-muted)] text-xs mt-2">
          {formatDuration(currentTrack.duration)}
        </p>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-200"
              style={{ width: `${(progress / 30) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[var(--color-text-muted)] text-[10px]">
              {formatProgress(progress)}
            </span>
            <span className="text-[var(--color-text-muted)] text-[10px]">
              0:30
            </span>
          </div>
        </div>

        {/* Status */}
        <p className="text-[var(--color-accent)] text-xs mt-2">
          {isPlaying ? '● Playing' : '○ Stopped'}
        </p>

        {/* Deezer link */}
        <a
          href={currentTrack.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline underline-offset-2 transition-colors"
        >
          Écouter sur Deezer ↗
        </a>

        {/* Album tracklist */}
        {albumTracks.length > 0 && (
          <div className="mt-5 border-t border-[var(--color-border)] pt-4">
            <h3 className="text-[var(--color-text-muted)] text-[10px] uppercase tracking-widest mb-2">
              Album
            </h3>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {albumTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleTrackClick(track)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                    track.id === currentTrack.id
                      ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                      : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
                  }`}
                >
                  {track.title_short}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add TrackInfoPanel to App.tsx**

In `src/App.tsx`, add:

```tsx
import { TrackInfoPanel } from './components/ui/TrackInfoPanel'
```

Add after `<SearchBar />`:

```tsx
      <TrackInfoPanel />
```

- [ ] **Step 4: Verify types compile**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/TrackInfoPanel.tsx src/utils/formatters.ts src/App.tsx
git commit -m "feat: add TrackInfoPanel with progress bar and album tracklist"
```

---

## Task 15: VinylHoverInfo UI Component

**Files:**
- Create: `src/components/ui/VinylHoverInfo.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create hover info component**

Create `src/components/ui/VinylHoverInfo.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { useSceneStore } from '../../stores/sceneStore'
import type { DeezerTrack } from '../../types'

export function VinylHoverInfo(): React.ReactElement | null {
  const [hoveredTrack, setHoveredTrack] = useState<DeezerTrack | null>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const sceneState = useSceneStore((s) => s.state)

  useEffect(() => {
    const handleHover = (e: CustomEvent<{ track: DeezerTrack | null; x: number; y: number }>) => {
      setHoveredTrack(e.detail.track)
      setPosition({ x: e.detail.x, y: e.detail.y })
    }

    window.addEventListener('vinyl-hover', handleHover as EventListener)
    return () => window.removeEventListener('vinyl-hover', handleHover as EventListener)
  }, [])

  if (sceneState !== 'browsing' || !hoveredTrack) return null

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ left: position.x + 16, top: position.y - 10 }}
    >
      <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-[var(--color-border)]">
        <p className="text-[var(--color-text)] text-sm font-medium leading-tight">
          {hoveredTrack.title_short}
        </p>
        <p className="text-[var(--color-text-muted)] text-xs mt-0.5">
          {hoveredTrack.artist.name}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add hover event dispatch to VinylRecord**

In `src/components/scene/VinylRecord.tsx`, update `handlePointerEnter` and `handlePointerLeave` to also dispatch custom events. Add to `handlePointerEnter`:

```tsx
  const handlePointerEnter = (e: ThreeEvent<PointerEvent>): void => {
    setHovered(true)
    onPointerEnter?.()
    document.body.style.cursor = 'pointer'
    window.dispatchEvent(new CustomEvent('vinyl-hover', {
      detail: { track, x: e.clientX, y: e.clientY },
    }))
  }

  const handlePointerLeave = (): void => {
    setHovered(false)
    onPointerLeave?.()
    document.body.style.cursor = 'default'
    window.dispatchEvent(new CustomEvent('vinyl-hover', {
      detail: { track: null, x: 0, y: 0 },
    }))
  }
```

Add the import at the top of VinylRecord.tsx:

```tsx
import type { ThreeEvent } from '@react-three/fiber'
```

Update the `onPointerEnter` handler on the sleeve mesh to pass the event:

```tsx
onPointerEnter={(e) => handlePointerEnter(e)}
```

- [ ] **Step 3: Add VinylHoverInfo to App.tsx**

In `src/App.tsx`, add:

```tsx
import { VinylHoverInfo } from './components/ui/VinylHoverInfo'
```

Add after `<TrackInfoPanel />`:

```tsx
      <VinylHoverInfo />
```

- [ ] **Step 4: Verify types compile**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/VinylHoverInfo.tsx src/components/scene/VinylRecord.tsx src/App.tsx
git commit -m "feat: add VinylHoverInfo tooltip on vinyl hover"
```

---

## Task 16: Vinyl Selection Animation

**Files:**
- Create: `src/hooks/useVinylAnimation.ts`
- Modify: `src/components/scene/VinylShelf.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create the animation hook**

This hook orchestrates the vinyl selection animation sequence: the selected vinyl moves from the shelf to the turntable.

Create `src/hooks/useVinylAnimation.ts`:

```ts
import { useRef, useEffect, useCallback } from 'react'
import { Vector3 } from 'three'
import type { Group } from 'three'
import { useSceneStore } from '../stores/sceneStore'
import { usePlayerStore } from '../stores/playerStore'
import { useAudio } from './useAudio'

const TURNTABLE_POSITION = new Vector3(2, 0.02, 0)
const ANIMATION_DURATION = 2500 // ms

interface AnimationState {
  startTime: number
  startPos: Vector3
  phase: 'slide-out' | 'show-cover' | 'disc-out' | 'travel'
}

export function useVinylAnimation(): {
  animatingRef: React.RefObject<Group | null>
} {
  const animatingRef = useRef<Group | null>(null)
  const animState = useRef<AnimationState | null>(null)
  const sceneState = useSceneStore((s) => s.state)
  const selectedVinylId = useSceneStore((s) => s.selectedVinylId)
  const tracks = useSceneStore((s) => s.tracks)
  const setState = useSceneStore((s) => s.setState)
  const { playPreview } = useAudio()
  const play = usePlayerStore((s) => s.play)

  const startAnimation = useCallback(() => {
    if (!animatingRef.current) return

    animState.current = {
      startTime: Date.now(),
      startPos: animatingRef.current.position.clone(),
      phase: 'slide-out',
    }
  }, [])

  // Trigger animation when a vinyl is selected
  useEffect(() => {
    if (sceneState !== 'animating' || !selectedVinylId) return

    const track = tracks.find((t) => t.id === selectedVinylId)
    if (!track) return

    startAnimation()

    // Simplified: after animation duration, transition to playing
    const timer = setTimeout(() => {
      setState('playing')
      play(track)
      playPreview(track.preview)
    }, ANIMATION_DURATION)

    return () => clearTimeout(timer)
  }, [sceneState, selectedVinylId, tracks, startAnimation, setState, play, playPreview])

  return { animatingRef }
}
```

- [ ] **Step 2: Integrate animation hook into App.tsx**

In `src/App.tsx`, add:

```tsx
import { useVinylAnimation } from './hooks/useVinylAnimation'
```

Inside the `App` function, add:

```tsx
  useVinylAnimation()
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useVinylAnimation.ts src/App.tsx
git commit -m "feat: add vinyl selection animation with timed playback start"
```

---

## Task 17: Back to Browsing Flow

**Files:**
- Modify: `src/components/ui/TrackInfoPanel.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add "back to shelf" button to TrackInfoPanel**

In `src/components/ui/TrackInfoPanel.tsx`, add a back button. After the "Écouter sur Deezer" link, add:

```tsx
        {/* Back to shelf */}
        <button
          onClick={() => {
            clearSelection()
            stopPlayback()
          }}
          className="mt-4 w-full py-2 rounded-lg bg-white/5 text-[var(--color-text-muted)] text-xs hover:bg-white/10 hover:text-[var(--color-text)] transition-colors cursor-pointer"
        >
          ← Retour au bac
        </button>
```

Add the missing store/hook references at the top of the component:

```tsx
  const clearSelection = useSceneStore((s) => s.clearSelection)
```

And accept `stopPlayback` as a prop or import `useAudio`. Since `useAudio` creates audio elements, it's better to pass `stopPlayback` via props. Add to the component props:

```tsx
interface TrackInfoPanelProps {
  stopPlayback: () => void
}

export function TrackInfoPanel({ stopPlayback }: TrackInfoPanelProps): React.ReactElement | null {
```

- [ ] **Step 2: Pass stopPlayback from App.tsx**

In `src/App.tsx`, import and use `useAudio`:

```tsx
import { useAudio } from './hooks/useAudio'
```

In the App function:

```tsx
  const { stopPlayback } = useAudio()
```

Update the TrackInfoPanel render:

```tsx
      <TrackInfoPanel stopPlayback={stopPlayback} />
```

- [ ] **Step 3: Verify the flow works**

Run: `yarn dev`

1. Browse the shelf
2. Click a vinyl → animation → playback starts
3. Click "Retour au bac" → camera returns to shelf, music stops

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/TrackInfoPanel.tsx src/App.tsx
git commit -m "feat: add back-to-shelf navigation from playback view"
```

---

## Task 18: Final Integration & Visual Polish

**Files:**
- Modify: `src/App.tsx` (final wiring)
- Modify: various scene components (tuning)

- [ ] **Step 1: Verify full flow end-to-end**

Start both servers:

Terminal 1: `vercel dev` (proxy on port 3000)
Terminal 2: `yarn dev` (Vite on port 5173)

Test the complete flow:
1. Page loads → shelf fills with trending tracks
2. Scroll → navigates through vinyls
3. Hover → tooltip shows track info
4. Click vinyl → animation sequence
5. Preview plays → turntable spins, tonearm is down
6. Panel shows track info, progress bar, album tracklist
7. Preview ends → turntable stops, tonearm lifts
8. Click album track → new vinyl plays
9. "Retour au bac" → back to shelf
10. Search → results replace shelf content
11. Clear search → back to trending

- [ ] **Step 2: Fix any visual issues**

Adjust camera positions, lighting intensity, vinyl sizes, shelf proportions as needed. The constants in `SceneManager.tsx`, `SceneLighting.tsx`, `VinylShelf.tsx`, and `Turntable.tsx` are starting points — tune them visually.

- [ ] **Step 3: Run lint and type check**

```bash
yarn lint
npx tsc --noEmit
```

Fix any errors.

- [ ] **Step 4: Test production build**

```bash
yarn build
yarn preview
```

Verify the app works in production mode.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete MVP integration — browse, select, play vinyl flow"
```

---

## Summary

| Task | What it delivers |
|---|---|
| 1 | Clean slate — Tailwind, dark background, app shell |
| 2 | TypeScript types for Deezer API + scene |
| 3 | Vercel serverless proxy for Deezer |
| 4 | API client with caching + React hooks |
| 5 | Zustand stores (scene, player, search) |
| 6 | Audio playback hook |
| 7 | Scene lighting |
| 8 | VinylRecord 3D component |
| 9 | VinylShelf with scroll navigation |
| 10 | Turntable with spinning + tonearm |
| 11 | Camera manager with state transitions |
| 12 | Full R3F Canvas wired up |
| 13 | Search bar overlay |
| 14 | Track info panel with tracklist |
| 15 | Hover tooltip |
| 16 | Vinyl selection animation |
| 17 | Back-to-shelf navigation |
| 18 | End-to-end integration + polish |

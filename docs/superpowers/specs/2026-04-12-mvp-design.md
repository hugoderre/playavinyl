# Play a Vinyl — MVP Design Spec

## 1. Overview

Play a Vinyl is a full 3D web experience for music discovery. Users browse a virtual vinyl shelf, select a record, watch it animate onto a turntable, and listen to a 30-second Deezer preview. The entire app lives inside a single Three.js scene — there are no traditional web pages.

**Target**: desktop browsers only for MVP.

## 2. User Flow

### 2.1 Arrival

The user lands directly in the 3D experience. No landing page, no splash screen. They see:
- A wooden vinyl shelf (meuble) in perspective, filled with trending tracks from Deezer `/chart`
- A search bar floating as an HTML overlay at the top of the screen
- Warm, dim lighting — record shop ambiance

### 2.2 Browsing

- **Scroll** (mouse wheel or touch) navigates horizontally through the shelf
- Vinyls are arranged vertically inside the shelf, like a real record crate
- The closest vinyl is large and sharp; further ones recede in perspective (see `MOCK-VINYL-FLOW.html` for the 2D reference)
- **Hover** on a vinyl shows a tooltip with title + artist
- **Search** replaces the shelf contents with Deezer search results

### 2.3 Selection & Animation Sequence

Click on a vinyl triggers a continuous animation:

1. The vinyl slides out of the shelf, facing the camera
2. The sleeve/cover displays in front of the user
3. The disc slides out of the sleeve
4. The disc travels through the scene to the turntable

The camera follows the action — single scene, no cuts.

### 2.4 Playback

- The disc lands on the turntable platter
- The tonearm lowers onto the record
- The disc spins, the 30-second preview plays
- A transparent info panel appears on the right side

### 2.5 End of Preview

- After 30 seconds, the music stops
- The disc stops spinning, the tonearm lifts
- The user can:
  - Click another track from the album tracklist (in the info panel)
  - Return to the shelf to pick another vinyl

## 3. UI Components

### 3.1 HTML Overlays (on top of the 3D scene)

**SearchBar**
- Always visible at the top of the screen
- Debounced input (300ms) → calls Deezer `/search` via proxy
- Results replace the shelf contents
- Clear/reset returns to trending

**TrackInfoPanel**
- Visible only during Playing state
- Transparent background, right side of the screen
- Content: title, artist, album name, cover art, duration, release date, 30s progress bar, album tracklist (clickable), "Listen on Deezer" link

**VinylHoverInfo**
- Small tooltip appearing on hover over a vinyl in the shelf
- Content: title + artist

### 3.2 3D Components (R3F)

**VinylShelf**
- Wooden furniture piece with legs, viewed in perspective (see `FURNITURE-VINYLE.png`)
- Static geometry, PBR wood materials
- Extends in depth to suggest infinity
- Contains vinyl slots

**VinylRecord**
- Two parts: sleeve (square, with album cover texture) + disc (round, with grooves, center label, spindle)
- Uses InstancedMesh for records inside the shelf (shared geometry, per-instance cover texture)
- Cover textures loaded directly from Deezer CDN (`cdn-images.dzcdn.net`, CORS OK)
- Disc has subtle groove ring detail and a colored center label matching the cover palette

**Turntable**
- Base/plinth
- Spinning platter
- Tonearm with pivot, arm, and stylus
- Animations: platter rotation (33⅓ RPM feel), tonearm lower/raise

**SceneLighting**
- Warm ambient lighting: point lights with amber/orange tones
- Subtle shadows for depth
- Dark environment — the vinyls and turntable are the focal points

## 4. Scene Architecture

Single R3F Canvas, single continuous scene. Two logical states managed by `sceneStore`:

| State | Camera Position | What's Active |
|---|---|---|
| `browsing` | Facing the shelf, lateral movement on scroll | Shelf + vinyls, hover interactions |
| `animating` | Follows the vinyl through the animation sequence | Animation playing, no user input |
| `playing` | Focused on the turntable | Turntable spinning, info panel visible |

Camera transitions are animated (smooth lerp/spring), never instant.

## 5. State Management (Zustand)

### sceneStore
```
state: 'browsing' | 'animating' | 'playing'
scrollPosition: number
selectedVinylId: string | null
albumTracks: Track[]
```

### playerStore
```
currentTrack: Track | null
isPlaying: boolean
progress: number (0-30)
volume: number
audioElement: HTMLAudioElement | null
```

### searchStore
```
query: string
results: Track[]
isLoading: boolean
isSearchActive: boolean
```

## 6. Data Layer

### Deezer API Proxy

Vercel serverless function at `/api/deezer/[...path].ts`:
- Forwards requests to `https://api.deezer.com/{path}`
- Passes query parameters through
- Returns JSON response
- No auth required

### API Calls

| Action | Endpoint | Proxy needed |
|---|---|---|
| Initial load (trending) | `GET /chart/0/tracks` | Yes |
| Search | `GET /search?q={query}` | Yes |
| Album tracklist | `GET /album/{id}/tracks` | Yes |
| Cover images | `cdn-images.dzcdn.net/images/cover/...` | No (CORS: `*`) |
| Preview MP3 | `cdnt-preview.dzcdn.net/api/...` | No (via `<audio>`) |

### Client-Side Caching

- Cache search results by query string (in-memory Map, cleared on session end)
- Cache album tracklists by album ID
- Debounce search input at 300ms

## 7. Audio

- Standard `HTMLAudioElement` for preview playback — no Web Audio API processing in MVP
- Audio effects (crackle, warmth) deferred to V2
- Preview URLs from Deezer search/track responses, played directly (no proxy needed)
- On track end: dispatch stop event to `playerStore`

## 8. 3D Performance Strategy

- **Frustum culling**: Three.js native — off-screen vinyls cost nothing
- **InstancedMesh**: single geometry for all shelf vinyls, per-instance texture
- **Lazy texture loading**: cover images loaded as vinyls approach the viewport
- **LOD (Level of Detail)**: distant vinyls use simplified geometry
- **Texture size**: use `cover_medium` (250x250) for shelf, `cover_big` (500x500) for selected vinyl and info panel

## 9. Project Structure

```
src/
├── components/
│   ├── scene/
│   │   ├── VinylShelf.tsx
│   │   ├── VinylRecord.tsx
│   │   ├── Turntable.tsx
│   │   └── SceneLighting.tsx
│   └── ui/
│       ├── SearchBar.tsx
│       ├── TrackInfoPanel.tsx
│       └── VinylHoverInfo.tsx
├── hooks/
│   ├── useAudio.ts
│   ├── useDeezer.ts
│   └── useVinylAnimation.ts
├── stores/
│   ├── sceneStore.ts
│   ├── playerStore.ts
│   └── searchStore.ts
├── api/
│   └── deezer.ts
├── types/
│   └── index.ts
├── utils/
│   └── formatters.ts
├── App.tsx
└── main.tsx

api/
└── deezer/
    └── [...path].ts
```

## 10. Out of Scope (V2+ Roadmap)

1. Collection / favoris (localStorage then cloud)
2. User accounts & auth
3. Vinyl audio effects (crackle, warmth)
4. Responsive / mobile
5. Genre browsing & curated crates
6. Trending/charts dedicated section
7. Social sharing
8. Turntable skins & environments
9. Vinyl customization (colors, splatter)
10. Return animation (vinyl back to shelf)
11. Autoplay / queue
12. Public shareable collections
13. SEO / meta tags

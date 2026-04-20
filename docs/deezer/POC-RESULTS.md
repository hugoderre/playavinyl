# Deezer API — POC Results (2026-04-06)

## Validated

### 1. Search API
- `GET https://api.deezer.com/search?q={query}` returns tracks with `preview` URL, album covers, artist info
- No auth required
- Advanced search available: `artist:"name"`, `track:"title"`, `bpm_min`, `dur_min`, etc.

### 2. Preview MP3 (30s)
- URLs like `https://cdnt-preview.dzcdn.net/api/1/...mp3?hdnea=...`
- Signed URLs with expiration token (`exp=` param)
- ~480 KB per preview, `audio/mpeg`
- **Works directly from browser** via `<audio>` / Web Audio API — no proxy needed
- Duration confirmed: 29.99s
- Note: preview URLs have `access-control-allow-headers: Range` but no explicit `access-control-allow-origin` → works via `<audio>` element (not fetch)

### 3. Cover Images as Textures
- Available sizes: `cover_small` (56x56), `cover_medium` (250x250), `cover_big` (500x500), `cover_xl` (1000x1000)
- **`access-control-allow-origin: *`** → can be loaded directly as Three.js textures with `crossOrigin="anonymous"`
- Canvas not tainted — confirmed pixel read works
- No proxy needed

### 4. API CORS
- Deezer JSON API does NOT send CORS headers → all API calls (search, track, album) must go through server proxy
- Covers and audio previews are fine without proxy

## Rate Limits
- Documented: 50 requests / 5 seconds
- Per IP (no auth = IP-based throttling)
- Tested: 55 concurrent requests returned 200 OK (soft limit or burst tolerance)
- **Impact on architecture**: proxy via Vercel serverless means all users share Vercel IP pool
  - Mitigations: server-side cache (Vercel KV/Redis), CDN edge cache, debounced client search
  - Covers + previews bypass proxy entirely, reducing load significantly

## What Needs Proxy (Vercel Serverless)
- `/api/deezer/search?q=...`
- `/api/deezer/track/{id}`
- `/api/deezer/album/{id}`
- `/api/deezer/artist/{id}`
- `/api/deezer/chart`
- `/api/deezer/genre`

## What Works Directly from Browser
- Cover images (all sizes) — for Three.js textures
- Preview MP3 URLs — for Web Audio API playback

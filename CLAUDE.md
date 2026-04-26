# CLAUDE.md

Guidance for Claude (or any AI assistant) working on this repo. **Read this in
full before touching code.** It captures conventions, hard-won traps, and the
current shape of the experience so each conversation can pick up cleanly.

## Project

Play a Vinyl (playavinyl.com) — an immersive web app for music discovery. The
entire product **is** a single 3D scene: the user browses a vinyl crate, picks
a record, and watches it fly to a turntable that plays a 30-second Deezer
preview. The 3D scene is the product; UI overlays are minimal and only appear
when they earn their place.

Solo side project, built incrementally. The design bar is **Apple-grade
taste** (see `~/.claude/projects/.../memory/feedback_steve_jobs_filter.md`).

## Commands

- `yarn dev` — Vite dev server with HMR (no Deezer proxy)
- `yarn build` — typecheck then production build (`tsc -b && vite build`)
- `yarn lint` — ESLint
- `yarn preview` — preview production build
- `vercel dev` — local dev with the Deezer serverless proxy (use this for full functionality)

## Stack

- **React 19** + strict TypeScript (no `any`, explicit return types on exports)
- **Three.js** via `@react-three/fiber` + `@react-three/drei`
- **Zustand** for shared state (composition over prop drilling)
- **Tailwind CSS v4** for styling (no CSS modules)
- **Vite 8** with `@vitejs/plugin-react`
- **Yarn** as package manager
- **Hosting**: Vercel (frontend + serverless API routes)
- **Domain**: playavinyl.com (OVH DNS → Vercel)

## Architecture

```
src/
├── components/
│   ├── scene/                     # 3D — react-three-fiber
│   │   ├── VinylShelf.tsx         # The browse view. Hero record + ghost stack peek.
│   │   │                          # Owns scroll/snap, breath/parallax/halo pulse,
│   │   │                          # hero hover-scale, HeroAtmosphere lights.
│   │   ├── VinylRecord.tsx        # Single record mesh (sleeve + cover texture).
│   │   │                          # `interactive` prop gates clickability + hover
│   │   │                          # tooltip + cursor change. Has a forgiving
│   │   │                          # invisible click-catcher when interactive.
│   │   ├── FlyingVinyl.tsx        # The 4s flight from origin to platter.
│   │   │                          # Carries its own travelling lights so the cover
│   │   │                          # stays visible mid-air. Disc emerges, sleeve
│   │   │                          # fades, disc recenters, tilts flat for landing.
│   │   ├── Turntable.tsx          # The platter, tonearm, plinth, VinylOnPlatter.
│   │   │                          # Platter+disc spin with INERTIA (spool up/down).
│   │   │                          # TurntableAtmosphere emits cover-tinted lights
│   │   │                          # with a halo-pulse + needle-drop flash.
│   │   ├── SceneManager.tsx       # Camera choreography. Browse / animating /
│   │   │                          # playing positions. During animating, dollies
│   │   │                          # via smoothstep AND tracks the flying vinyl
│   │   │                          # with lead-room bias so it stays framed.
│   │   ├── SceneLighting.tsx      # Global lights, fog, turntable spotlight.
│   │   └── DustParticles.tsx      # Reusable dust mote system with soft sprites.
│   │
│   └── ui/                        # 2D overlays (z above the canvas)
│       ├── SearchBar.tsx          # Top center. Cmd+K focus, ESC clear.
│       │                          # Hidden when sceneState !== 'browsing'.
│       ├── BrowsingOverlay.tsx    # Title bottom-left, counter top-right,
│       │                          # scroll affordance bottom-right.
│       ├── BrowseStateMessage.tsx # Loading + empty-search states (centered).
│       ├── TrackInfoPanel.tsx     # Right-side glass card while playing.
│       │                          # Status pill + title + progress + album drawer.
│       │                          # Accents tinted by the cover's dominant color.
│       ├── BackToShelf.tsx        # Glass pill top-left while playing. ESC hotkey.
│       └── VinylHoverInfo.tsx     # Floating tooltip near cursor for stack peeks.
│
├── hooks/
│   ├── useDeezer.ts               # useChartTracks (mounts once), useDeezerSearch
│   │                              # (debounced 300ms), getAlbumTracks.
│   ├── useAudio.ts                # Single shared HTMLAudioElement.
│   │                              # Handles autoplay-blocked → setAutoplayBlocked.
│   ├── useVinylAnimation.ts       # The 4s timer that flips animating→playing.
│   ├── useDocumentTitle.ts        # Tab title mirrors playing track.
│   └── useDominantColor.ts        # Canvas-based color extraction with cache.
│
├── stores/                        # Zustand
│   ├── sceneStore.ts              # state ('browsing'|'animating'|'playing'),
│   │                              # scrollPosition (clamped), tracks, albumTracks,
│   │                              # selectedVinylId, animationStartedAt.
│   ├── playerStore.ts             # currentTrack, isPlaying, progress, autoplayBlocked.
│   └── searchStore.ts             # query, results, isLoading.
│
├── api/
│   └── deezer.ts                  # fetchCached wrapper, searchTracks, getChartTracks,
│                                  # getAlbumTracks. All hit /api/deezer proxy.
│
├── types/index.ts                 # DeezerTrack, DeezerSearchResponse, SceneState.
├── utils/formatters.ts            # formatDuration, formatProgress.
├── App.tsx                        # Wires Canvas + 3D scene + 2D overlays + vignette.
├── main.tsx                       # Entry. Exposes stores on window.__playavinyl in DEV
│                                  # mode for E2E testing (tree-shaken in prod).
└── index.css                      # Tailwind + base reset + scroll-pellet/fade-in keyframes.

api/
└── deezer/
    └── [...path].ts               # Vercel serverless proxy for Deezer (CORS workaround).
```

## State machine

```
browsing  ──click hero / Enter / Space──▶  animating  ──after 4s──▶  playing
   ▲                                                                     │
   └────────────  ESC / "Retour au bac" / clearSelection  ◀──────────────┘
```

`sceneStore.state` drives nearly everything visual: which 3D objects render,
which UI overlays mount, which camera waypoint is targeted.

## Critical conventions & traps

- **Tailwind utilities can be silently overridden by CSS reset rules outside
  `@layer base`.** `index.css` wraps the universal `* { padding: 0; ... }`
  reset in `@layer base` so `pl-12`, `px-7`, etc. actually win. If you ever
  add another global rule (e.g. `input { ... }`), put it in `@layer base` or
  it will break utility padding everywhere with no error message.

- **The 4-second `ANIMATION_DURATION_MS` is duplicated** in `App.tsx` and
  `SceneManager.tsx`. The camera dolly uses smoothstep against this duration
  to track the flying vinyl. If you change it in one place, change both.

- **`FlyingVinyl` END_POS and `VinylOnPlatter` position must match exactly**
  (currently y=0.018) so the hand-off when state flips to 'playing' is
  invisible. `END_POS` is also matched in `SceneManager`'s `flyPos()` for
  the camera tracking math.

- **Only the hero is interactive.** Stack records get `interactive={false}`
  → no onClick, no cursor change, only hover tooltip. The hero gets a
  `1.2× × 1.12×` invisible click-catcher just in front of the visible mesh
  for forgiving hitboxes.

- **`stopPropagation()` on pointer events** in `VinylRecord` is mandatory.
  Without it, the raycaster passes through stacked records and the deepest
  one wins the tooltip dispatch.

- **`scrollPosition` is clamped in the store action**, not just at call sites.
  `setTracks` resets it to 0 so a new collection (search → charts) always
  lands on its first record.

- **`useDominantColor` and the visible texture share the same `cover_big`
  URL** so the browser cache serves both with one fetch.

## Animation timings (cheat sheet)

- 4000 ms — full fly (`ANIMATION_DURATION_MS`)
- 720 ms — canvas fade-in when first tracks arrive
- 480 ms — soft fade-in for UI overlays (`animate-fade-in-soft`)
- 280 ms — album drawer slide
- 110 ms — scroll settle delay (then lerps at 0.18/frame)
- 1.6 s loop — scroll pellet drifting down

## Keyboard shortcuts

- **Wheel / Arrow keys (←↑→↓)** — scroll through the crate. Arrows are
  ignored while focus is in `<input>` so the search-bar caret works.
- **Enter / Space** (when not in input, while browsing) — play the hero.
- **ESC** — back to shelf if playing; clear+blur search if focused.
- **Cmd+K / Ctrl+K** — focus the search bar.

## Dev mode helpers

`main.tsx` exposes `window.__playavinyl = { sceneStore, playerStore }` when
`import.meta.env.DEV` is true. Useful for Playwright tests and console
poking. Tree-shaken in production builds.

## Deezer API

- **Base URL**: `https://api.deezer.com`
- **CORS**: Deezer doesn't support browser CORS — every call goes through
  `/api/deezer/[...path].ts`.
- **No auth** for public endpoints.
- **Caching**: `fetchCached` keeps responses for 5 minutes in memory. Use
  it for any new endpoint. Debouncing for search is in `useDeezerSearch`
  (300 ms).
- **Cover sizes**: prefer `cover_big` (500×500) for any visible texture so
  hero crops stay crisp on retina; the URL is shared with `useDominantColor`
  for cache hits.

## Code conventions

- Functional components only, hooks for all logic.
- Components: PascalCase files, one component per file.
- Hooks: `use` prefix, in `/hooks`.
- 3D scene components stay in `components/scene/`; UI in `components/ui/`.
- Tailwind for all styling. CSS keyframes only in `index.css`.
- Zustand for shared state, composition over prop drilling.
- French comments are fine; code (variables, functions, types) is English.
- Explicit return types on exported functions.
- No `any`. Use proper Three.js / R3F types.

## Design direction

- **Aesthetic**: warm, analog, retro-modern — dimly lit record-shop vibes.
- **Palette**: dark backgrounds, cover-tinted accents (the dominant color of
  the playing record carries the room). Warm key lights are `#fff0d8`,
  global accent `var(--color-accent)` is `#e67e22`.
- **Typography**: clean sans-serif for UI, large hero titles bottom-left.
- **Motion**: physics-inspired — the platter has inertia, the crate breathes,
  the hero leans toward the cursor, the disc lands gently.
- **Less is more**: the user's eye should land on the cover. UI is glass
  pills, low contrast where possible, only loud at moments of action.

## Testing notes

- Playwright via the MCP can drive the page through `window.__playavinyl`.
  Synthetic pointer events do **not** reach the R3F raycaster, so hover/click
  on 3D meshes can't be tested via dispatched events; trigger flows through
  the store instead.
- Screenshots from Playwright are sometimes captured a frame or two before
  the wait completes; verify state via `__playavinyl.sceneStore.getState()`
  rather than trusting a single screenshot.

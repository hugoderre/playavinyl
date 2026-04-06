# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Play a Vinyl (playavinyl.com) — an immersive web app for music discovery. Users browse a virtual vinyl library, place records on a 3D turntable, and listen to 30-second Deezer previews with realistic animations (spinning vinyl, tonearm drop, crackle effects). The 3D turntable is the centerpiece; everything else supports it.

Solo side project, built incrementally.

## Commands

- `yarn dev` — start Vite dev server with HMR
- `yarn build` — typecheck then build (`tsc -b && vite build`)
- `yarn lint` — ESLint
- `yarn preview` — preview production build
- `vercel dev` — local dev with serverless functions (Deezer proxy)

## Stack

- **React 19** with strict TypeScript (no `any`, explicit return types on exports)
- **Three.js** via `@react-three/fiber` + `@react-three/drei`
- **Zustand** for state management (prefer over prop drilling)
- **Tailwind CSS v4** for all styling (no CSS modules, no styled-components)
- **Web Audio API** for playback + vinyl audio effects (crackle, warmth)
- **Vite 8** with `@vitejs/plugin-react`
- **Yarn** as package manager
- **Hosting**: Vercel (frontend + serverless API routes)
- **Domain**: playavinyl.com (OVH DNS → Vercel)

## Architecture

```
src/
├── components/
│   ├── scene/          # R3F 3D components (Turntable, Vinyl, Tonearm, Room)
│   ├── ui/             # 2D interface (SearchBar, Library, TrackInfo, Controls)
│   └── layout/         # App shell, navigation
├── hooks/              # Custom hooks (useDeezer, useAudio, useTurntable)
├── stores/             # Zustand stores (playerStore, libraryStore, searchStore)
├── api/                # Deezer API client functions
├── types/              # TypeScript types/interfaces
├── utils/              # Helpers (formatters, audio processing)
└── assets/             # Static assets (textures, models)

api/                    # Vercel serverless functions
└── deezer/
    └── [...path].ts    # Proxy for Deezer API (CORS workaround)
```

Entry point: `src/main.tsx` → `src/App.tsx`.

## Deezer API

- **Base URL**: `https://api.deezer.com`
- **Key endpoints**: `/search?q=`, `/track/{id}`, `/album/{id}`, `/artist/{id}/top`, `/chart`, `/genre`
- **CORS**: Deezer does NOT support browser CORS — all calls go through Vercel serverless proxy (`/api/deezer/[...path].ts`)
- **No auth** needed for public endpoints
- **Caching**: implement client-side caching and debounced search (no official rate limit docs)
- **Legal**: must link back to Deezer content, previews support the 3D experience (not standalone)

## Code Conventions

- Functional components only, hooks for all logic
- Components: PascalCase files, one component per file
- Hooks: `use` prefix, in `/hooks`
- Keep Three.js scene components (`components/scene/`) separate from UI (`components/ui/`)
- Tailwind for all styling
- Zustand for shared state, composition over prop drilling
- French comments OK, but code (variables, functions, types) must be in English

## Design Direction

- **Aesthetic**: warm, analog, retro-modern — dimly lit record shop vibes
- **Palette**: dark backgrounds, warm amber/orange accents, cream/off-white text
- **Typography**: clean sans-serif for UI, optional serif/display for branding
- **Animations**: smooth, physics-inspired — vinyl should feel heavy, tonearm deliberate

# Play a Vinyl

An immersive music discovery experiment where the interface is a record shop.

Browse a glowing vinyl crate, choose a sleeve, and watch the record fly across
the room to a turntable. The platter spins up with inertia, the tonearm drops,
and a 30-second Deezer preview starts playing while the lighting shifts toward
the album cover's dominant color.

The 3D scene is the product: minimal overlays, warm analog lighting, physical
motion, and just enough UI to help the user keep browsing.

## The Experience

- A vinyl crate as the main navigation, with a hero sleeve and stacked records
  peeking behind it.
- Cover art rendered as real 3D objects, not flat cards floating over a page.
- A four-second sleeve-to-turntable flight with camera choreography, travelling
  lights, and a soft color trail.
- A turntable scene with spinning platter inertia, tonearm progress, dust motes,
  fog, and cover-tinted atmosphere.
- Deezer chart and search discovery with playable 30-second previews.
- Keyboard shortcuts for fast browsing: arrows, Enter/Space, Escape, and Cmd/Ctrl
  + K.

## Stack

- React 19
- TypeScript
- Vite
- Three.js with `@react-three/fiber` and `@react-three/drei`
- Zustand
- Tailwind CSS v4
- Deezer public API through a Vercel serverless proxy

## Getting Started

Install dependencies:

```sh
yarn install
```

Run the Vite app:

```sh
yarn dev
```

Run with the Deezer proxy locally:

```sh
vercel dev
```

Build for production:

```sh
yarn build
```

## Scripts

- `yarn dev` starts the Vite dev server.
- `yarn build` type-checks and builds the production bundle.
- `yarn lint` runs ESLint.
- `yarn preview` serves the production build locally.
- `vercel dev` runs the app with local serverless API routes.

## API

Deezer does not support browser CORS for direct client calls, so requests go
through `/api/deezer/[...path].ts`. Public chart, search, track, and album
endpoints require no authentication.

## Project Status

Play a Vinyl is a solo side project in active exploration. The goal is not to
recreate a streaming app dashboard, but to make music discovery feel tactile,
cinematic, and a little magical.

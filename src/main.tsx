import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { useSceneStore } from './stores/sceneStore'
import { usePlayerStore } from './stores/playerStore'

// Dev-only: expose stores for E2E testing in the console / Playwright.
// Tree-shaken out of production builds.
if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__playavinyl = {
    sceneStore: useSceneStore,
    playerStore: usePlayerStore,
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

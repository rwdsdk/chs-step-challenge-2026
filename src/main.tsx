import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'

// Temporary haze-advisory notice, shown in place of the leaderboard for
// everyone. Unlike the old teaser-preview flag this replaced, this one is
// *meant* to be set in Vercel's production env while the advisory is active
// — flip VITE_HAZE_MODE=true to show it, remove it (or set to false) once
// it's safe to resume the challenge.
const TeaserPage = lazy(() => import('./TeaserPage.tsx'))
const isHazeMode = import.meta.env.VITE_HAZE_MODE === 'true'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isHazeMode ? (
      <Suspense fallback={null}>
        <TeaserPage />
      </Suspense>
    ) : (
      <App />
    )}
    <Analytics />
  </StrictMode>,
)

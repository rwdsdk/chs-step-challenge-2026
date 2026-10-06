import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'

// Replaces the leaderboard for everyone while set. This is meant to be set in
// Vercel's production env (and redeployed) to hide the leaderboard, and
// removed again to bring it back:
//   VITE_SITE_MODE=teaser  countdown page ("results are on their way") with
//                          the live PSI reading
//   VITE_SITE_MODE=haze    plain "challenge paused" notice with the full
//                          PSI / PM2.5 readings
//   unset                  normal leaderboard
const TeaserPage = lazy(() => import('./TeaserPage.tsx'))
const HazePage = lazy(() => import('./HazePage.tsx'))
const siteMode = import.meta.env.VITE_SITE_MODE

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {siteMode === 'teaser' ? (
      <Suspense fallback={null}>
        <TeaserPage />
      </Suspense>
    ) : siteMode === 'haze' ? (
      <Suspense fallback={null}>
        <HazePage />
      </Suspense>
    ) : (
      <App />
    )}
    <Analytics />
  </StrictMode>,
)

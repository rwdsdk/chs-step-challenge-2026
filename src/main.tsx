import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'

// What the site shows for everyone. Set VITE_SITE_MODE in Vercel's production
// env and redeploy to switch (Vite bakes it in at build time):
//   leaderboard  the normal leaderboard (also the fallback if unset)
//   teaser       countdown page ("results are on their way") with the PSI reading
//   haze         plain "challenge paused" notice with the full PSI / PM2.5 readings
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

import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'

// Hidden preview path for the "results sealed" teaser — not linked anywhere in the UI.
// Also gated behind a local-only env flag (never set in production) so it's
// completely inert for anyone who finds/guesses the URL until deliberately enabled.
const TeaserPage = lazy(() => import('./TeaserPage.tsx'))
const isTeaserPreview = import.meta.env.VITE_ENABLE_TEASER === 'true' && window.location.pathname === '/teaser'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isTeaserPreview ? (
      <Suspense fallback={null}>
        <TeaserPage />
      </Suspense>
    ) : (
      <App />
    )}
    <Analytics />
  </StrictMode>,
)

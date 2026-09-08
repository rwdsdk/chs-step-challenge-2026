// ─── Admin Configuration ───────────────────────────────────────────────────
// Data is fetched from Box at build time via scripts/fetch-data.mjs.
// Set BOX_XLSX_URL as a GitHub Actions secret (Settings → Secrets → Actions).

export const CHALLENGE_NAME = 'CHS Step Challenge 2026';
export const CHALLENGE_MONTH = '14 September - 11 October';
// Explicit +08:00 (Singapore) offset so the boundary is correct for every viewer's timezone.
export const CHALLENGE_START = '2026-09-14T00:00:00+08:00';
export const CHALLENGE_END = '2026-10-11T23:59:59+08:00';

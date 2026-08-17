# Step Challenge Leaderboard

## What this project is
A static leaderboard web app for the company's monthly Step Challenge. Teams compete
on total steps walked. An admin maintains the data in Google Sheets; this app reads
it and renders a live-updating leaderboard.

## Stack
- React 19 + TypeScript (Vite)
- Tailwind CSS v4 (`@tailwindcss/vite` plugin — no `tailwind.config.js`)
- shadcn/ui components (Table, Card, Badge)
- PapaParse for CSV parsing from Google Sheets
- pnpm as the package manager

## Key files
| File | Purpose |
|------|---------|
| `src/config.ts` | **Admin config** — set `SHEETS_CSV_URL` here after publishing the sheet |
| `src/hooks/useLeaderboard.ts` | Fetches & parses CSV; auto-refreshes on `REFRESH_INTERVAL_MS` |
| `src/App.tsx` | Main UI — header, leaderboard table, error/loading states |
| `src/index.css` | Tailwind + shadcn CSS variables; do not remove the imports at the top |

## Admin workflow

### Setting up Google Sheets
1. Create a sheet with this column layout:
   ```
   Team Name | Week 1 | Week 2 | Week 3 | Week 4 | Total
   ```
   - `Total` column should be a SUM formula: `=SUM(B2:E2)`
   - Column names can be anything; the app auto-detects week columns
2. **File → Share → Publish to web → Sheet: your sheet → Format: CSV → Publish**
3. Copy the published URL and paste it into `src/config.ts` as `SHEETS_CSV_URL`

### Updating scores
- Open the Google Sheet and fill in each team's weekly step total
- The leaderboard auto-refreshes within 5 minutes (configurable via `REFRESH_INTERVAL_MS`)

## Development
```bash
pnpm dev        # start dev server
pnpm build      # production build → dist/
pnpm preview    # preview production build locally
```

## Deployment (Vercel — recommended)
1. Push this repo to GitHub
2. Import the repo on vercel.com → Framework: Vite → Deploy
3. Every push to `main` auto-deploys

## Deployment (GitHub Pages)
1. In `vite.config.ts`, add `base: '/step-challenge/'` (repo name)
2. Run `pnpm build`
3. Push the `dist/` folder to the `gh-pages` branch
   (or use the `gh-pages` npm package to automate)

## Conventions
- No CSS files other than `src/index.css`; use Tailwind utility classes everywhere
- shadcn components live in `src/components/ui/` — do not edit them manually
- Data logic stays in `src/hooks/`; UI stays in `src/App.tsx`
- The app is intentionally a single page; do not add a router unless the scope grows

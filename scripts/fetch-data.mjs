#!/usr/bin/env node
/**
 * Downloads the leaderboard xlsx from Box via the Box API (Client Credentials Grant)
 * and writes src/data/leaderboard.json for the Vite build.
 *
 * Required environment variables (set as GitHub Actions secrets):
 *   BOX_CLIENT_ID      — Box app client ID
 *   BOX_CLIENT_SECRET  — Box app client secret
 *   BOX_ENTERPRISE_ID  — Box enterprise ID (Admin Console → Account & Billing)
 *   BOX_FILE_ID        — Box file ID (number in the file's URL)
 *
 * Expected xlsx column layout (first sheet):
 *   Team Name | Week 1 | Week 2 | ... | Total
 */

import { writeFileSync, readFileSync } from 'node:fs';
import * as XLSX from 'xlsx';

const { BOX_CLIENT_ID, BOX_CLIENT_SECRET, BOX_ENTERPRISE_ID, BOX_FILE_ID } = process.env;

for (const [name, val] of Object.entries({ BOX_CLIENT_ID, BOX_CLIENT_SECRET, BOX_ENTERPRISE_ID, BOX_FILE_ID })) {
  if (!val) {
    console.error(`ERROR: Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

// ── 1. Get access token via Client Credentials Grant ──────────────────────────
console.log('Authenticating with Box (CCG)…');
const tokenRes = await fetch('https://api.box.com/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: BOX_CLIENT_ID,
    client_secret: BOX_CLIENT_SECRET,
    box_subject_type: 'enterprise',
    box_subject_id: BOX_ENTERPRISE_ID,
  }),
});

if (!tokenRes.ok) {
  const body = await tokenRes.text();
  console.error(`ERROR: Box token request failed (${tokenRes.status}): ${body}`);
  process.exit(1);
}

const { access_token } = await tokenRes.json();
console.log('Authenticated.');

// ── 2. Download the xlsx file ─────────────────────────────────────────────────
console.log(`Downloading file ${BOX_FILE_ID} from Box…`);
const fileRes = await fetch(`https://api.box.com/2.0/files/${BOX_FILE_ID}/content`, {
  headers: { Authorization: `Bearer ${access_token}` },
  redirect: 'follow',
});

if (!fileRes.ok) {
  const body = await fileRes.text();
  console.error(`ERROR: Box file download failed (${fileRes.status}): ${body}`);
  process.exit(1);
}

const buffer = Buffer.from(await fileRes.arrayBuffer());
console.log(`Downloaded ${buffer.length} bytes.`);

// ── 3. Parse xlsx ─────────────────────────────────────────────────────────────
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: 0 });

if (rows.length === 0) {
  console.error('ERROR: Sheet is empty.');
  process.exit(1);
}

const allKeys = Object.keys(rows[0]);
const weekKeys = allKeys.filter((k) => k !== 'Team Name' && k !== 'Total');

function parseSteps(val) {
  if (typeof val === 'number') return val;
  return parseInt(String(val).replace(/,/g, ''), 10) || 0;
}

const teams = rows
  .filter((r) => String(r['Team Name'] ?? '').trim())
  .map((row) => ({
    teamName: String(row['Team Name']).trim(),
    weeklySteps: weekKeys.map((w) => ({ label: w, steps: parseSteps(row[w]) })),
    total: parseSteps(row['Total']),
  }))
  .sort((a, b) => b.total - a.total);

// ── 4. Compute rank changes vs previous run ───────────────────────────────────
const outPath = new URL('../src/data/leaderboard.json', import.meta.url).pathname;
let prevRanks = null;
try {
  const prev = JSON.parse(readFileSync(outPath, 'utf8'));
  if (Array.isArray(prev.teams)) {
    prevRanks = Object.fromEntries(prev.teams.map((t, i) => [t.teamName, i + 1]));
  }
} catch {
  // No previous file — first run, rank changes will be null
}

const teamsWithRankChange = teams.map((team, i) => {
  const currentRank = i + 1;
  const previousRank = prevRanks?.[team.teamName] ?? null;
  const rankChange = previousRank !== null ? previousRank - currentRank : null;
  return { ...team, rankChange };
});

const output = {
  generatedAt: new Date().toISOString(),
  weekLabels: weekKeys,
  teams: teamsWithRankChange,
};

// ── 5. Write output ───────────────────────────────────────────────────────────
writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`Written to ${outPath} (${teams.length} teams)`);

#!/usr/bin/env node
/**
 * Aggregates per-team StepUp CSV exports into src/data/leaderboard.json.
 *
 * Usage:
 *   node scripts/aggregate-stepup.mjs [folder]
 *
 * `folder` defaults to ~/Desktop/step counts. It must contain:
 *   - Exactly one .xlsx registration export (any filename) with columns
 *     'Team Name' and a members column starting with
 *     "Please list your team members" — used to build each team's roster.
 *   - Any number of *.csv StepUp exports (any filename — StepUp's export
 *     filenames are opaque and change every time, so files are matched to a
 *     team by comparing member names against the roster, never by filename).
 *
 * Admin names to exclude from every team's total live in the local, gitignored
 * scripts/team-roster.local.json (not committed, since even plain names are
 * treated as data not to publish in this public repo):
 *   { "admins": ["sean", "charlotte lim"] }
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, extname } from 'node:path';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const CHALLENGE_START = new Date('2026-09-14T00:00:00+08:00');
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEK_LABELS = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
const MIN_MATCH_SCORE = 2;

const folder = process.argv[2] ?? join(homedir(), 'Desktop', 'step counts');
const scriptDir = new URL('.', import.meta.url).pathname;
const rosterConfigPath = join(scriptDir, 'team-roster.local.json');
const outPath = join(scriptDir, '..', 'src', 'data', 'leaderboard.json');

// ── 1. Load admin exclusion list ───────────────────────────────────────────────
let admins;
try {
  admins = JSON.parse(readFileSync(rosterConfigPath, 'utf8')).admins.map((n) => normalizeName(n));
} catch {
  console.error(`ERROR: Could not read ${rosterConfigPath}. Expected { "admins": ["name", ...] }`);
  process.exit(1);
}

// ── 2. Find the registration xlsx and the CSVs ─────────────────────────────────
const entries = readdirSync(folder);
const xlsxFiles = entries.filter((f) => extname(f).toLowerCase() === '.xlsx');
const csvFiles = entries.filter((f) => extname(f).toLowerCase() === '.csv');

if (xlsxFiles.length !== 1) {
  console.error(`ERROR: Expected exactly one .xlsx in ${folder}, found ${xlsxFiles.length}: ${xlsxFiles.join(', ')}`);
  process.exit(1);
}
if (csvFiles.length === 0) {
  console.error(`ERROR: No .csv files found in ${folder}`);
  process.exit(1);
}

// ── 3. Build each team's roster (name -> token set) from the xlsx ─────────────
function normalizeName(s) {
  return String(s).trim().toLowerCase();
}

function tokenize(s) {
  return normalizeName(s)
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((t) => t.length >= 2);
}

function tokensMatch(a, b) {
  if (a === b) return true;
  if (a.length >= 3 && b.length >= 3) return a.startsWith(b) || b.startsWith(a);
  return false;
}

const workbook = XLSX.read(readFileSync(join(folder, xlsxFiles[0])), { type: 'buffer' });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const regRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
const membersKey = Object.keys(regRows[0] ?? {}).find((k) => k.startsWith('Please list your team members'));
if (!membersKey) {
  console.error('ERROR: Could not find the team-members column in the registration xlsx.');
  process.exit(1);
}

const teams = regRows
  .map((row) => String(row['Team Name'] ?? '').trim())
  .filter(Boolean);

const teamTokenSets = new Map(); // teamName -> Set<token>

for (const row of regRows) {
  const teamName = String(row['Team Name'] ?? '').trim();
  if (!teamName) continue;
  const lines = String(row[membersKey] ?? '')
    .split(/\r?\n/)
    .map((l) => l.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);

  const tokens = new Set();
  for (const line of lines) {
    const namePart = line.split('/')[0];
    for (const t of tokenize(namePart)) tokens.add(t);
    const emailMatch = line.match(/([a-z0-9._-]+)@/i);
    if (emailMatch) {
      for (const t of tokenize(emailMatch[1].replace(/[._-]/g, ' '))) tokens.add(t);
    }
  }
  teamTokenSets.set(teamName, tokens);
}

// ── 4. Match each CSV to a team by scoring member names against rosters ───────
const weekTotals = new Map(); // teamName -> [w1, w2, w3, w4]
for (const t of teams) weekTotals.set(t, [0, 0, 0, 0]);

console.log(`Registration: ${teams.length} teams. Matching ${csvFiles.length} CSV file(s)...\n`);

for (const file of csvFiles) {
  const raw = readFileSync(join(folder, file), 'utf8');
  const { data: rows } = Papa.parse(raw, { header: true, skipEmptyLines: true });
  if (rows.length === 0) {
    console.warn(`  SKIP ${file}: empty CSV`);
    continue;
  }

  const dateCols = Object.keys(rows[0]).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k.trim()));

  const nonAdminRows = [];
  for (const row of rows) {
    const fullName = normalizeName(`${row['First Name'] ?? ''} ${row['Last Name'] ?? ''}`);
    if (admins.includes(fullName)) continue;
    nonAdminRows.push(row);
  }

  const scores = new Map();
  for (const row of nonAdminRows) {
    const rowTokens = tokenize(`${row['First Name'] ?? ''} ${row['Last Name'] ?? ''}`);
    for (const [teamName, tokenSet] of teamTokenSets) {
      const hit = rowTokens.some((rt) => [...tokenSet].some((tt) => tokensMatch(rt, tt)));
      if (hit) scores.set(teamName, (scores.get(teamName) ?? 0) + 1);
    }
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const [bestTeam, bestScore] = ranked[0] ?? [null, 0];
  const runnerUpScore = ranked[1]?.[1] ?? 0;

  if (!bestTeam || bestScore < MIN_MATCH_SCORE || bestScore === runnerUpScore) {
    console.warn(`  SKIP ${file}: could not confidently identify team (top matches: ${JSON.stringify(ranked.slice(0, 3))})`);
    continue;
  }

  console.log(`  ${file} -> "${bestTeam}" (matched ${bestScore}/${nonAdminRows.length} members)`);

  const buckets = weekTotals.get(bestTeam);
  for (const row of nonAdminRows) {
    for (const col of dateCols) {
      const date = new Date(`${col.trim()}T00:00:00+08:00`);
      const weekIdx = Math.min(3, Math.max(0, Math.floor((date - CHALLENGE_START) / WEEK_MS)));
      const raw = String(row[col] ?? '0').replace(/,/g, '');
      const steps = raw === 'N.A' ? 0 : parseInt(raw, 10) || 0;
      buckets[weekIdx] += steps;
    }
  }
}

// ── 5. Compute rank changes vs the previous leaderboard.json ──────────────────
let prevRanks = null;
try {
  const prev = JSON.parse(readFileSync(outPath, 'utf8'));
  if (Array.isArray(prev.teams)) {
    prevRanks = Object.fromEntries(prev.teams.map((t, i) => [t.teamName, i + 1]));
  }
} catch {
  // No previous file — first run, rank changes will be null
}

const teamRows = teams
  .map((teamName) => {
    const weeklySteps = weekTotals.get(teamName).map((steps, i) => ({ label: WEEK_LABELS[i], steps }));
    const total = weeklySteps.reduce((sum, w) => sum + w.steps, 0);
    return { teamName, weeklySteps, total };
  })
  .sort((a, b) => b.total - a.total)
  .map((team, i) => {
    const currentRank = i + 1;
    const previousRank = prevRanks?.[team.teamName] ?? null;
    const rankChange = previousRank !== null ? previousRank - currentRank : null;
    return { ...team, rankChange };
  });

// ── 6. Write output ────────────────────────────────────────────────────────────
const output = {
  generatedAt: new Date().toISOString(),
  weekLabels: WEEK_LABELS,
  teams: teamRows,
};

writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
console.log(`\nWritten to ${outPath} (${teamRows.length} teams)`);

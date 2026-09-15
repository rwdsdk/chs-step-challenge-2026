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
import { execSync } from 'node:child_process';
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

// ── 1. Load admin exclusion list + known nickname aliases ─────────────────────
let admins;
let nicknameAliases;
try {
  const rosterConfig = JSON.parse(readFileSync(rosterConfigPath, 'utf8'));
  admins = rosterConfig.admins.map((n) => normalizeName(n));
  nicknameAliases = new Map(
    Object.entries(rosterConfig.nicknameAliases ?? {}).map(([alias, real]) => [normalizeName(alias), real])
  );
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

function tokenizeRowName(row) {
  const fullName = `${row['First Name'] ?? ''} ${row['Last Name'] ?? ''}`.trim();
  const alias = nicknameAliases.get(normalizeName(fullName));
  return tokenize(alias ?? fullName);
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

// ── 4. Seed week totals from the previous leaderboard.json (so a team with no
//       matched CSV this run keeps its prior data instead of being zeroed) ────
let prevTeams = null;
try {
  const prev = JSON.parse(readFileSync(outPath, 'utf8'));
  if (Array.isArray(prev.teams)) prevTeams = prev.teams;
} catch {
  // No previous file — first run
}
const prevWeekTotals = new Map(prevTeams?.map((t) => [t.teamName, t.weeklySteps.map((w) => w.steps)]) ?? []);

// Bonuses are applied manually (not derivable from StepUp CSVs) and must survive
// re-running this script — otherwise re-aggregating a week that already has a bonus
// would silently drop it. Carry the bonus/bonusLabel metadata forward for every team
// regardless of whether it's matched to a fresh CSV this run.
const prevBonusInfo = new Map(
  prevTeams?.map((t) => [t.teamName, t.weeklySteps.map((w) => (w.bonus ? { bonus: w.bonus, bonusLabel: w.bonusLabel } : null))]) ?? []
);

// Rank-change baseline: prefer the last *committed* leaderboard.json (a day boundary)
// over the current working-tree file, so multiple same-day edits (an aggregate run
// plus a manual bonus tweak, say) accumulate into one "change since yesterday" figure
// instead of each edit overwriting the previous one's delta. Falls back to the
// working-tree version if there's no commit history for this file yet.
let committedTeams = null;
try {
  const raw = execSync('git show HEAD:src/data/leaderboard.json', {
    cwd: join(scriptDir, '..'),
    stdio: ['pipe', 'pipe', 'ignore'],
  }).toString();
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed.teams)) committedTeams = parsed.teams;
} catch {
  // Not a git repo, no commits yet, or file not committed — fall back below
}
const rankBaselineTeams = committedTeams ?? prevTeams;

const weekTotals = new Map(); // teamName -> [w1, w2, w3, w4]
for (const t of teams) weekTotals.set(t, prevWeekTotals.get(t) ?? [0, 0, 0, 0]);
const matchedTeams = new Set();

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
    const rowTokens = tokenizeRowName(row);
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
  matchedTeams.add(bestTeam);

  const latestCol = dateCols.length
    ? dateCols.reduce((a, b) => (new Date(`${a.trim()}T00:00:00+08:00`) > new Date(`${b.trim()}T00:00:00+08:00`) ? a : b))
    : null;
  const bestTeamTokens = teamTokenSets.get(bestTeam);

  const buckets = [0, 0, 0, 0]; // this CSV is a full re-export, not incremental — recompute fresh
  weekTotals.set(bestTeam, buckets);
  for (const row of nonAdminRows) {
    for (const col of dateCols) {
      const date = new Date(`${col.trim()}T00:00:00+08:00`);
      const weekIdx = Math.min(3, Math.max(0, Math.floor((date - CHALLENGE_START) / WEEK_MS)));
      const raw = String(row[col] ?? '0').replace(/,/g, '');
      const steps = raw === 'N.A' ? 0 : parseInt(raw, 10) || 0;
      buckets[weekIdx] += steps;
    }

    const name = `${row['First Name'] ?? ''} ${row['Last Name'] ?? ''}`.trim();
    const rowTokens = tokenizeRowName(row);
    const rosterHit = rowTokens.some((rt) => [...bestTeamTokens].some((tt) => tokensMatch(rt, tt)));
    const latestSteps = latestCol ? (String(row[latestCol] ?? '0').replace(/,/g, '') === 'N.A' ? 0 : parseInt(String(row[latestCol] ?? '0').replace(/,/g, ''), 10) || 0) : null;
    const flag = rosterHit ? '' : '  <-- unmatched to roster, verify manually';
    console.log(`      ${name.padEnd(22)} ${latestCol ?? '(no date col)'}: ${String(latestSteps ?? '?').padEnd(8)}${flag}`);
  }
}

const unmatchedTeams = teams.filter((t) => !matchedTeams.has(t));
if (unmatchedTeams.length) {
  console.log(`\nTeams with no matched CSV this run (kept at their existing totals):`);
  for (const t of unmatchedTeams) console.log(`  - ${t}`);
}

// ── 5. Compute rank changes vs the previous leaderboard.json ──────────────────
const prevRanks = rankBaselineTeams ? Object.fromEntries(rankBaselineTeams.map((t, i) => [t.teamName, i + 1])) : null;

const teamRows = teams
  .map((teamName) => {
    // A freshly-matched team's weekTotals were just recomputed from organic CSV data
    // only (see step 4), so any known bonus for that week needs to be added back on
    // top. A team carried forward unchanged already has its bonus baked into `steps`
    // from last time, so it must NOT be added again here.
    const wasMatched = matchedTeams.has(teamName);
    const bonusPerWeek = prevBonusInfo.get(teamName) ?? [];
    const weeklySteps = weekTotals.get(teamName).map((organicSteps, i) => {
      const info = bonusPerWeek[i];
      const steps = wasMatched && info ? organicSteps + info.bonus : organicSteps;
      return info ? { label: WEEK_LABELS[i], steps, bonus: info.bonus, bonusLabel: info.bonusLabel } : { label: WEEK_LABELS[i], steps };
    });
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

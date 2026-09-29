---
description: Aggregate the latest StepUp CSV exports into src/data/leaderboard.json
argument-hint: [folder path, defaults to ~/Desktop/step counts]
---

Update the CHS Step Challenge leaderboard from the latest StepUp export.

## Context

`~/Desktop/step counts` (or the folder passed as `$ARGUMENTS`) contains:
- Exactly one `.xlsx` registration export (filename changes every export — never
  assume a specific name) with the current team roster.
- One `.csv` StepUp export per team (filenames are opaque and change every
  export too — teams are matched by fuzzy-comparing member names against the
  roster, never by filename).

`scripts/aggregate-stepup.mjs` already does the matching, admin-exclusion
(`scripts/team-roster.local.json`, gitignored), and week-bucketing (relative to
`CHALLENGE_START`, 2026-09-14 GMT+8) automatically. It also preserves any
team's existing data if that team has no matching CSV in a given run, so
partial exports are safe to run. It also carries forward and correctly
re-applies any existing per-week bonus on top of the freshly-aggregated organic
total, so re-running it never silently drops a bonus.

**Bonuses are separate from this script and won't be picked up automatically.**
If the user doesn't mention one, ask: "Did any team earn a bonus this round?"
Bonuses are per-week (a team could have a different bonus in Week 1 vs Week 2,
etc.), so confirm which week it applies to — usually the current/active week,
but don't assume. A single week can hold **more than one bonus** — e.g. a team
can earn both the standard "Completed weekly event" bonus and a separate
"Most improved" bonus in the same week. Each gets its own badge in the UI
(a gift icon for `kind: "event"`, a running-shoe icon for `kind: "improved"`)
rather than being merged into one. Apply a confirmed bonus as its own step,
separate from running the script: **append** a `{ amount, label, kind }`
object to that team's specific week's `bonuses` array in `weeklySteps`
(creating the array if it doesn't exist yet) — never overwrite an existing
entry in that array, since that would silently delete a previously-earned
bonus. Use `kind: "event"` for the standard weekly-completion bonus and
`kind: "improved"` for the Most Improved bonus. Add the new bonus amount into that week's `steps`, recompute `total`
(sum of all `bonuses[].amount` plus organic steps, same as always), re-sort
by total, and recompute `rankChange` the same way the script does (rank vs
the last **committed** version of `leaderboard.json`, not whatever's
currently in the working tree — see the comment above `committedTeams` in
the script for why).

## Steps

1. Run:
   ```
   node scripts/aggregate-stepup.mjs "${ARGUMENTS:-$HOME/Desktop/step counts}"
   ```
2. Read the script's own output carefully:
   - Every line flagged `<-- unmatched to roster, verify manually` is a person
     whose StepUp display name didn't fuzzy-match anyone on their team's
     roster (often a nickname or initials, e.g. "wn" for "Waye Ning"). The team
     assignment itself is still reliable (backed by the other matched
     members) — only that individual's identity is uncertain. List these out
     for the user to confirm rather than silently trusting the guess.
   - A `SKIP <file>: could not confidently identify team` warning means a CSV
     didn't match any team well enough — surface this prominently, don't
     ignore it.
   - A `Teams with no matched CSV this run` section lists any team that kept
     its previous data untouched this round — call this out explicitly so the
     user knows those numbers are stale, not that the team did nothing.
3. Cross-check the number of matched teams against the actual team count from
   the registration `.xlsx` (read fresh each time — don't assume it's still
   17, rosters change).
4. Report a summary to the user: for each team, list each member's name and
   their steps on the **most recent** date column (the script prints this
   directly — it's the day's individual number, not the cumulative `Total
   Steps` field from the CSV).
5. Confirm `src/data/leaderboard.json` was updated (new `generatedAt`, ranks
   reordered by total) and mention anything from steps 2-3 that needs the
   user's manual review.

Do not commit anything — leave the updated `leaderboard.json` (and any other
changes) in the working tree for the user to review first.

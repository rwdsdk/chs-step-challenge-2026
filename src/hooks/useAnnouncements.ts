import { useState } from 'react';
import type { Announcement } from './useLeaderboard';

const STORAGE_KEY = 'chs-step-challenge-2026:seen-announcement-ids';

function readSeenIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set(); // localStorage unavailable/corrupt — fail open, never crash
  }
}

function writeSeenIds(ids: Set<string>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Private browsing / storage disabled / quota exceeded — dismiss just
    // won't persist across reloads. Not fatal, nothing to surface to the user.
  }
}

export function useAnnouncements(all: Announcement[]) {
  const [seenIds, setSeenIds] = useState<Set<string>>(() => readSeenIds());
  const unseen = all.filter((a) => !seenIds.has(a.id));

  // Dismisses one at a time (not the whole batch) — the banner shows a single
  // announcement, and dismissing it reveals the next unseen one, if any.
  const dismiss = (id: string) => {
    const next = new Set(seenIds);
    next.add(id);
    setSeenIds(next);
    writeSeenIds(next);
  };

  return { unseen, dismiss };
}

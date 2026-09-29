import data from '../data/leaderboard.json';

export interface WeeklyStep {
  label: string;
  steps: number; // includes all bonuses for that week
  bonuses?: { amount: number; label: string; kind?: 'event' | 'improved' }[];
}

export interface TeamRow {
  teamName: string;
  weeklySteps: WeeklyStep[];
  total: number;
  rankChange: number | null; // positive = moved up, negative = moved down, 0 = same, null = no prior data
}

export interface Announcement {
  id: string;
  date: Date;
  // A structured bonus announcement (rendered with the same week color/icon as
  // the badges) — weekIdx, kind, title, amount, and teams should all be
  // present together. Falls back to plain `message` text when absent, so a
  // future non-bonus announcement doesn't need this structure.
  weekIdx?: number;
  kind?: 'event' | 'improved';
  title?: string;
  amount?: number;
  teams?: string[];
  message?: string;
}

export interface LeaderboardState {
  data: TeamRow[];
  weekLabels: string[];
  generatedAt: Date | null;
  announcements: Announcement[];
}

export function useLeaderboard(): LeaderboardState {
  const generatedAt = data.generatedAt ? new Date(data.generatedAt) : null;
  const announcements = (data.announcements ?? []).map((a) => ({ ...a, date: new Date(a.date) }));

  return {
    data: data.teams as TeamRow[],
    weekLabels: data.weekLabels,
    generatedAt,
    announcements,
  };
}

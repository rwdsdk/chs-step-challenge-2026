import data from '../data/leaderboard.json';

export interface TeamRow {
  teamName: string;
  weeklySteps: { label: string; steps: number }[];
  total: number;
  rankChange: number | null; // positive = moved up, negative = moved down, 0 = same, null = no prior data
}

export interface LeaderboardState {
  data: TeamRow[];
  weekLabels: string[];
  generatedAt: Date | null;
}

export function useLeaderboard(): LeaderboardState {
  const generatedAt = data.generatedAt ? new Date(data.generatedAt) : null;

  return {
    data: data.teams as TeamRow[],
    weekLabels: data.weekLabels,
    generatedAt,
  };
}

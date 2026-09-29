import { useEffect, useState } from 'react';

export type RegionReadings = Record<string, number>;

export interface HazeData {
  officialUpdatedAt: string; // ISO
  psi: RegionReadings;
  pm25: RegionReadings;
}

// Caching/rate-limit protection lives server-side now (api/haze.ts, edge-cached
// for 15 minutes and shared by every visitor) — this hook just fetches it.
export function useHazeData() {
  const [data, setData] = useState<HazeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/haze')
      .then((res) => {
        if (!res.ok) throw new Error(`request failed: ${res.status}`);
        return res.json() as Promise<HazeData>;
      })
      .then((json) => {
        setData(json);
        setError(null);
      })
      .catch(() => setError('Unable to load current readings.'))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

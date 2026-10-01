import type { RegionReadings } from '@/hooks/useHazeData';

export const REGION_LABELS: Record<string, string> = {
  north: 'North',
  south: 'South',
  east: 'East',
  west: 'West',
  central: 'Central',
};

export const REGION_ORDER = ['north', 'south', 'east', 'west', 'central'];

export function highestRegion(readings: RegionReadings): string | null {
  const entries = Object.entries(readings);
  if (entries.length === 0) return null;
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', hour: 'numeric', minute: '2-digit',
  });
}

import type { RegionReadings } from '@/hooks/useHazeData';
import { psiBand } from '@/lib/psiBands';
import { REGION_LABELS, REGION_ORDER, highestRegion } from '@/lib/hazeFormat';

function PsiRow({ region, value, isHighest }: { region: string; value: number; isHighest: boolean }) {
  const band = psiBand(value);
  return (
    <div className="flex items-center justify-between py-2">
      <span className={`text-sm ${isHighest ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
        {REGION_LABELS[region] ?? region}
      </span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold tabular-nums ${isHighest ? 'text-foreground' : 'text-muted-foreground'}`}>{value}</span>
        <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ${band.bg} ${band.text} ${band.ring}`}>
          {band.label}
        </span>
      </div>
    </div>
  );
}

function Pm25Row({ region, value, isHighlighted }: { region: string; value: number; isHighlighted: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={`text-sm ${isHighlighted ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{REGION_LABELS[region] ?? region}</span>
      <span className={`text-sm tabular-nums text-foreground ${isHighlighted ? 'font-bold' : 'font-semibold'}`}>{value} µg/m³</span>
    </div>
  );
}

export function HazeReadings({
  psi,
  pm25,
  highlightRegion,
}: {
  psi: RegionReadings;
  pm25: RegionReadings;
  // Defaults to the worst region; pass a specific region (e.g. "central") to
  // highlight that one instead, matching whatever a caller's headline shows.
  highlightRegion?: string;
}) {
  const highest = highlightRegion ?? highestRegion(psi);
  return (
    <>
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">PSI (24-hour)</h2>
        <div className="divide-y divide-border">
          {REGION_ORDER.filter((r) => r in psi).map((region) => (
            <PsiRow key={region} region={region} value={psi[region]} isHighest={region === highest} />
          ))}
        </div>
      </div>
      <div className="mt-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">PM2.5 (1-hour)</h2>
        <div className="divide-y divide-border">
          {REGION_ORDER.filter((r) => r in pm25).map((region) => (
            <Pm25Row key={region} region={region} value={pm25[region]} isHighlighted={region === highlightRegion} />
          ))}
        </div>
      </div>
    </>
  );
}

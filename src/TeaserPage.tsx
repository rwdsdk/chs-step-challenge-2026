import { useHazeData, type RegionReadings } from '@/hooks/useHazeData';
import { psiBand } from '@/lib/psiBands';
import { CHALLENGE_NAME } from '@/config';

const REGION_LABELS: Record<string, string> = {
  north: 'North',
  south: 'South',
  east: 'East',
  west: 'West',
  central: 'Central',
};

const REGION_ORDER = ['north', 'south', 'east', 'west', 'central'];

function highestRegion(readings: RegionReadings): string | null {
  const entries = Object.entries(readings);
  if (entries.length === 0) return null;
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', hour: 'numeric', minute: '2-digit',
  });
}

function PsiRow({ region, value, isHighest }: { region: string; value: number; isHighest: boolean }) {
  const band = psiBand(value);
  return (
    <div className="flex items-center justify-between py-2.5">
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

function Pm25Row({ region, value }: { region: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{REGION_LABELS[region] ?? region}</span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{value} µg/m³</span>
    </div>
  );
}

export default function TeaserPage() {
  const { data, loading, error } = useHazeData();
  const highestPsi = data ? highestRegion(data.psi) : null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-lg mx-auto px-4 py-10">
        <p className="text-xs font-medium text-muted-foreground mb-2">{CHALLENGE_NAME}</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-3">Step Challenge Paused</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          With haze conditions in Singapore, NEA is advising against prolonged outdoor activity. We're pausing the
          step challenge for everyone's safety. Your team's progress and scores aren't affected, and the challenge
          will resume once conditions improve.
        </p>

        {error && (
          <div className="rounded-3xl bg-card border border-border shadow-sm px-4 py-4 mb-4 text-sm text-muted-foreground">
            {error} Check the latest readings directly at{' '}
            <a href="https://www.haze.gov.sg" target="_blank" rel="noreferrer" className="text-foreground underline">
              haze.gov.sg
            </a>
            .
          </div>
        )}

        {loading && !data && (
          <div className="rounded-3xl bg-card border border-border shadow-sm px-4 py-6 mb-4 text-sm text-muted-foreground text-center">
            Loading current readings…
          </div>
        )}

        {data && (
          <>
            <div className="rounded-3xl bg-card border border-border shadow-sm px-4 py-3 mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                PSI (24-hour)
              </h2>
              <div className="divide-y divide-border">
                {REGION_ORDER.filter((r) => r in data.psi).map((region) => (
                  <PsiRow key={region} region={region} value={data.psi[region]} isHighest={region === highestPsi} />
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-card border border-border shadow-sm px-4 py-3 mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                PM2.5 (1-hour)
              </h2>
              <div className="divide-y divide-border">
                {REGION_ORDER.filter((r) => r in data.pm25).map((region) => (
                  <Pm25Row key={region} region={region} value={data.pm25[region]} />
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Readings as of {formatTimestamp(data.officialUpdatedAt)}
              {' '}· Source:{' '}
              <a href="https://www.haze.gov.sg" target="_blank" rel="noreferrer" className="underline">
                haze.gov.sg
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

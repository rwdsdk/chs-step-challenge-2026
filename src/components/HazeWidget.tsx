import { useState } from 'react';
import { useHazeData } from '@/hooks/useHazeData';
import { HazeReadings } from '@/components/HazeReadings';
import { psiBand } from '@/lib/psiBands';
import { highestRegion, formatTimestamp } from '@/lib/hazeFormat';

export function HazeWidget() {
  const { data } = useHazeData();
  const [expanded, setExpanded] = useState(false);

  if (!data) return null;

  const highest = highestRegion(data.psi);
  if (!highest) return null;
  const value = data.psi[highest];
  const band = psiBand(value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full ring-1 ring-inset ${band.bg} ${band.text} ${band.ring} cursor-pointer`}
      >
        PSI {value} · {band.label}
      </button>

      {expanded && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-3xl bg-card border border-border shadow-md px-4 py-3 z-20 text-left">
          <HazeReadings psi={data.psi} pm25={data.pm25} />
          <p className="text-[10px] text-muted-foreground text-center mt-3">
            As of {formatTimestamp(data.officialUpdatedAt)} · Source:{' '}
            <a href="https://www.haze.gov.sg" target="_blank" rel="noreferrer" className="underline">
              haze.gov.sg
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

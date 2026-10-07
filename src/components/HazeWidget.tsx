import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useHazeData } from '@/hooks/useHazeData';
import { HazeReadings } from '@/components/HazeReadings';
import { psiBand } from '@/lib/psiBands';
import { formatTimestamp } from '@/lib/hazeFormat';

const HEADLINE_REGION = 'central';

export function HazeWidget() {
  const { data, loading } = useHazeData();
  const [expanded, setExpanded] = useState(false);

  const value = data?.psi[HEADLINE_REGION];
  if (!data || value == null) {
    // Keep the chip in place when there's no reading so the header doesn't
    // shift around; it just isn't interactive since there's nothing to expand.
    return (
      <span className="inline-flex items-center text-[11px] font-medium px-2 py-1 rounded-full ring-1 ring-inset bg-secondary text-muted-foreground ring-border">
        PSI {loading ? '…' : 'N.A.'}
      </span>
    );
  }
  const band = psiBand(value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        title="24-hour PSI, Central"
        className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full ring-1 ring-inset ${band.bg} ${band.text} ${band.ring} cursor-pointer`}
      >
        <span className="opacity-70">PSI</span>
        <span className="text-xs font-bold">{value}</span>
        <span>{band.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-3xl bg-card border border-border shadow-md px-4 py-3 z-20 text-left">
          <HazeReadings psi={data.psi} pm25={data.pm25} highlightRegion={HEADLINE_REGION} />
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

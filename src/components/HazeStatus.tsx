import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { HazeData } from '@/hooks/useHazeData';
import { psiBand, type PsiBand } from '@/lib/psiBands';
import { REGION_LABELS, REGION_ORDER, formatTimestamp } from '@/lib/hazeFormat';

const HEADLINE_REGION = 'central';

const DOT: Record<PsiBand['statusKey'], string> = {
  good: 'bg-green-400',
  warning: 'bg-amber-400',
  serious: 'bg-orange-400',
  critical: 'bg-red-400',
};

// Quiet status line for dark pages: a coloured dot and soft text instead of a
// pastel pill, with a frosted panel for the regional readings on tap.
export function HazeStatus({ data }: { data: HazeData }) {
  const [open, setOpen] = useState(false);
  const value = data.psi[HEADLINE_REGION];
  if (value == null) return null;
  const band = psiBand(value);

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="24-hour PSI, Central"
        className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white/90 transition-colors cursor-pointer"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${DOT[band.statusKey]}`} />
        <span>
          PSI <span className="font-semibold text-white/90">{value}</span> · {band.label}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <p className="text-[11px] text-white/35 mt-1.5">Indoor steps count too. Please remember to stay hydrated.</p>

      {open && (
        <div className="mt-3 w-64 rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur-md px-4 py-2 text-left">
          <p className="text-[10px] uppercase tracking-widest text-white/40 py-1.5">24-hour PSI</p>
          <div className="divide-y divide-white/10">
            {REGION_ORDER.filter((r) => r in data.psi).map((r) => {
              const b = psiBand(data.psi[r]);
              const isHeadline = r === HEADLINE_REGION;
              return (
                <div key={r} className="flex items-center justify-between py-1.5 text-xs">
                  <span className={isHeadline ? 'text-white/90 font-medium' : 'text-white/55'}>
                    {REGION_LABELS[r] ?? r}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={`tabular-nums ${isHeadline ? 'text-white font-semibold' : 'text-white/70'}`}>
                      {data.psi[r]}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${DOT[b.statusKey]}`} />
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-white/35 text-center py-2">
            As of {formatTimestamp(data.officialUpdatedAt)} ·{' '}
            <a href="https://www.haze.gov.sg" target="_blank" rel="noreferrer" className="underline hover:text-white/70">
              haze.gov.sg
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

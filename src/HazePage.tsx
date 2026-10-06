import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useHazeData } from '@/hooks/useHazeData';
import { HazeReadings } from '@/components/HazeReadings';
import { psiBand } from '@/lib/psiBands';
import { formatTimestamp, REGION_LABELS, REGION_ORDER } from '@/lib/hazeFormat';
import { CHALLENGE_NAME } from '@/config';

export default function HazePage() {
  const { data, loading, error } = useHazeData();
  const [showAll, setShowAll] = useState(false);
  const [region, setRegion] = useState('central');

  const value = data?.psi[region];
  const pm25 = data?.pm25[region];
  const band = value != null ? psiBand(value) : null;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
      <motion.div
        className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-orange-400/10 blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 w-full max-w-lg px-4 py-10">
        <p className="text-sm font-medium text-white/50 mb-2">{CHALLENGE_NAME}</p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Leaderboard on pause</h1>
        <p className="text-sm text-white/60 leading-relaxed mb-8">
          NEA advises against prolonged outdoor activity, so the leaderboard is paused. Your steps are safe and still count. Indoor walks are encouraged until air quality improves.
        </p>

        <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 px-6 py-6 text-center">
          <p className="text-[11px] uppercase tracking-widest text-white/40">24-hour PSI</p>
          {data && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {REGION_ORDER.filter((r) => r in data.psi).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegion(r)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ring-1 cursor-pointer transition-colors ${
                    r === region
                      ? 'bg-white text-slate-900 ring-white'
                      : 'bg-white/5 text-white/60 ring-white/10 hover:text-white'
                  }`}
                >
                  {REGION_LABELS[r] ?? r}
                </button>
              ))}
            </div>
          )}
          {loading && !data ? (
            <p className="text-sm text-white/50 py-8">Loading current readings…</p>
          ) : (
            <>
              <p className={`font-bold leading-none mt-3 ${value != null ? 'text-7xl' : 'text-5xl text-white/60'}`}>
                {value ?? 'N.A.'}
              </p>
              {band && (
                <span
                  className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ring-1 mt-4 ${band.bg} ${band.text} ${band.ring}`}
                >
                  {band.label}
                </span>
              )}
              {pm25 != null && (
                <p className="text-xs text-white/60 mt-4">PM2.5 (1-hour): {pm25} µg/m³</p>
              )}
              {data && (
                <p className="text-xs text-white/40 mt-1">As of {formatTimestamp(data.officialUpdatedAt)}</p>
              )}
              {error && !data && (
                <p className="text-xs text-white/50 mt-4">
                  {error} Check the latest readings at{' '}
                  <a href="https://www.haze.gov.sg" target="_blank" rel="noreferrer" className="underline">
                    haze.gov.sg
                  </a>
                  .
                </p>
              )}
            </>
          )}
        </div>

        {data && (
          <>
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="mx-auto mt-4 flex items-center gap-1 text-xs font-medium text-white/60 hover:text-white cursor-pointer"
            >
              See all regions
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`} />
            </button>
            {showAll && (
              <div className="rounded-3xl bg-card text-foreground border border-border shadow-sm px-4 py-3 mt-3">
                <HazeReadings psi={data.psi} pm25={data.pm25} highlightRegion={region} />
              </div>
            )}
          </>
        )}

        <p className="text-xs text-white/40 text-center mt-8">
          Back once the air clears · Source:{' '}
          <a href="https://www.haze.gov.sg" target="_blank" rel="noreferrer" className="underline hover:text-white/70">
            haze.gov.sg
          </a>
        </p>
      </div>
    </div>
  );
}

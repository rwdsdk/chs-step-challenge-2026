import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { CHALLENGE_NAME } from '@/config';

// Mockup only — not wired to the real reveal date yet.
const REVEAL_AT = new Date('2026-10-12T00:00:00+08:00');
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now.getTime());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor(diff / 3600000) % 24,
    minutes: Math.floor(diff / 60000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
  };
}

// Classic decode effect: reveals `text` left-to-right through random characters
// whenever it changes. Purely decorative — never used on the live countdown
// itself, which needs to stay clean and readable every second.
function ScrambleText({ text, className }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 14;
    const id = setInterval(() => {
      frame++;
      if (frame >= totalFrames) {
        setDisplay(text);
        clearInterval(id);
        return;
      }
      const revealCount = Math.floor((frame / totalFrames) * text.length);
      setDisplay(
        text
          .split('')
          .map((ch, i) => (ch === ' ' || i < revealCount ? ch : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]))
          .join('')
      );
    }, 35);
    return () => clearInterval(id);
  }, [text]);

  return <span className={className}>{display}</span>;
}

function ScrambleSpotlight({ items }: { items: string[] }) {
  const [item, setItem] = useState(() => items[Math.floor(Math.random() * items.length)]);
  useEffect(() => {
    const id = setInterval(() => setItem(items[Math.floor(Math.random() * items.length)]), 5000);
    return () => clearInterval(id);
  }, [items]);
  return <ScrambleText text={item} className="text-lg font-semibold tracking-wide" />;
}

function TickerRow({
  names,
  duration,
  reverse,
  className,
}: {
  names: string[];
  duration: number;
  reverse?: boolean;
  className: string;
}) {
  const doubled = [...names, ...names];
  return (
    <div className={`absolute left-0 w-full overflow-hidden ${className}`}>
      <motion.div
        className="flex gap-12 whitespace-nowrap w-max"
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map((name, i) => (
          <span key={i} className="font-bold uppercase tracking-wide">
            {name}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export default function TeaserPage() {
  const { data } = useLeaderboard();
  const names = useMemo(() => data.map((t) => t.teamName), [data]);
  const { days, hours, minutes, seconds } = useCountdown(REVEAL_AT);

  // Aggregate-only stats — safe to show since they never reveal any team's
  // individual standing, unlike per-team totals or ranks.
  // Memoized so the array reference is stable across the once-a-second
  // re-renders from the countdown — otherwise ScrambleSpotlight's interval
  // gets torn down and restarted every second and never actually fires.
  const spotlightItems = useMemo(() => {
    const totalStepsAllTeams = data.reduce((sum, t) => sum + t.total, 0);
    return [...names, `${totalStepsAllTeams.toLocaleString()} steps walked together so far`, `${data.length} teams in the running`];
  }, [data, names]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-center">
      <TickerRow names={names} duration={48} className="top-[12%] text-6xl text-white/6" />
      <TickerRow names={names} duration={34} reverse className="top-1/2 -translate-y-1/2 text-4xl text-white/10" />
      <TickerRow names={names} duration={55} className="top-[82%] text-6xl text-white/6" />

      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        <p className="text-sm font-medium text-white/50 mb-2">{CHALLENGE_NAME}</p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Results are on their way</h1>
        <p className="text-sm text-white/60 mb-10">Rankings are sealed until the big reveal.</p>

        <div className="flex items-center justify-center gap-3 mb-10">
          {([['Days', days], ['Hours', hours], ['Min', minutes], ['Sec', seconds]] as const).map(([label, value]) => (
            <div key={label} className="min-w-20 text-center">
              <p className="text-5xl font-bold tabular-nums">{String(value).padStart(2, '0')}</p>
              <p className="text-[11px] uppercase tracking-wide text-white/50 mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="text-[11px] uppercase tracking-widest text-white/40">Now tallying</p>
          <ScrambleSpotlight items={spotlightItems} />
        </div>
      </div>
    </div>
  );
}

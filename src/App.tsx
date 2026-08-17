import { Tabs } from '@base-ui/react/tabs';
import { Accordion } from '@base-ui/react/accordion';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { CHALLENGE_NAME, CHALLENGE_MONTH } from '@/config';

const MEDALS = ['🥇', '🥈', '🥉'];

const RANK_COLORS: Record<number, { accent: string }> = {
  1: { accent: 'border-amber-400' },
  2: { accent: 'border-slate-400' },
  3: { accent: 'border-orange-400' },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How are steps counted?',
    a: 'Steps are tracked via the StepUp app, which pulls your total step count automatically.',
  },
  {
    q: 'Why are my steps not updated?',
    a: 'The StepUp app reads from Apple Health or Google Fit. Make sure your phone is syncing steps to Apple Health or Google Fit, then open the StepUp app and sync to push your latest data.',
  },
  {
    q: 'How are teams ranked?',
    a: 'Teams are ranked by their cumulative total steps across all weeks. In case of a tie, the team with more steps in the latest week ranks higher.',
  },
  {
    q: 'Can I join mid-challenge?',
    a: 'Yes! Contact your team captain or the challenge organiser. Steps only count from the week you join.',
  },
  {
    q: 'What counts as a step?',
    a: 'Any steps tracked by a fitness device or phone pedometer count. Indoor walking, treadmill, and outdoor walking/running all qualify.',
  },
];

function formatSteps(n: number): string {
  return n.toLocaleString();
}

function formatDateTime(d: Date): string {
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function RankChangeBadge({ change }: { change: number | null | undefined }) {
  if (change == null || change === 0) return null;
  return change > 0
    ? <span className="text-emerald-500 text-xs font-bold">↑{change}</span>
    : <span className="text-rose-400 text-xs font-bold">↓{Math.abs(change)}</span>;
}

export default function App() {
  const { data, weekLabels, generatedAt } = useLeaderboard();
  const hasData = data.length > 0;

  const activeWeekIdx = weekLabels.reduce((best, _, idx) => {
    return data.some(t => (t.weeklySteps[idx]?.steps ?? 0) > 0) ? idx : best;
  }, -1);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 overflow-x-hidden">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
              {CHALLENGE_NAME}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">{CHALLENGE_MONTH}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
            {generatedAt && (
              <span className="text-[10px] text-slate-400">
                {formatDateTime(generatedAt)}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-12 overflow-hidden">
        <Tabs.Root defaultValue="ranking">

          {/* Tab list */}
          <Tabs.List className="flex gap-1 bg-slate-200/70 p-1 rounded-2xl mb-5">
            {(['ranking', 'faq'] as const).map((tab) => (
              <Tabs.Tab
                key={tab}
                value={tab}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-slate-500 transition-all duration-150 cursor-pointer
                  data-active:bg-slate-600 data-active:text-white data-active:shadow-md
                  hover:text-slate-700"
              >
                {tab === 'ranking' ? 'Rankings' : 'FAQ'}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {/* Rankings tab */}
          <Tabs.Panel value="ranking" className="space-y-3">
            {!hasData ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center text-sm text-slate-400">
                No data yet. Upload the xlsx to Box and run the deploy workflow.
              </div>
            ) : (
              <>
                {/* Top 3 podium */}
                <div className="grid grid-cols-3 gap-2 mb-5 w-full">
                  {data.slice(0, 3).map((team, i) => {
                    const rank = i + 1;
                    const accent = RANK_COLORS[rank]?.accent ?? 'border-slate-200';
                    const thisWeekSteps = activeWeekIdx >= 0 ? team.weeklySteps[activeWeekIdx]?.steps ?? 0 : null;
                    return (
                      <div
                        key={team.teamName}
                        className={`flex flex-col items-center rounded-2xl bg-white border-2 ${accent} shadow-sm px-2 py-4 text-center min-w-0 overflow-hidden`}
                      >
                        <span className="text-2xl leading-none mb-1">{MEDALS[i]}</span>
                        <span className="text-xs font-semibold text-slate-700 leading-tight line-clamp-2 min-h-10 flex items-center justify-center w-full px-1">
                          {team.teamName}
                        </span>
                        <span className="mt-1 text-sm font-bold text-slate-900 tabular-nums">
                          {formatSteps(team.total)}
                          <span className="text-[10px] font-normal text-slate-400 ml-0.5">steps</span>
                        </span>
                        <div className="mt-1 flex items-center justify-center gap-1 h-4">
                          {thisWeekSteps !== null && (
                            <span className="text-[10px] text-slate-500 tabular-nums">
                              {formatSteps(thisWeekSteps)} this wk
                            </span>
                          )}
                          <RankChangeBadge change={team.rankChange} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Ranks 4+ list */}
                <div className="space-y-2">
                  {data.slice(3).map((team, i) => {
                    const thisWeekSteps = activeWeekIdx >= 0 ? team.weeklySteps[activeWeekIdx]?.steps ?? 0 : null;
                    return (
                      <div
                        key={team.teamName}
                        className="flex items-center gap-3 bg-white rounded-2xl px-4 py-4 shadow-sm border border-slate-100"
                      >
                        <span className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                          {i + 4}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-slate-800 truncate">{team.teamName}</p>
                            <RankChangeBadge change={team.rankChange} />
                          </div>
                          {thisWeekSteps !== null && (
                            <p className="text-xs text-slate-400 tabular-nums mt-0.5">{formatSteps(thisWeekSteps)} this week</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-slate-900 tabular-nums">{formatSteps(team.total)}</p>
                          <p className="text-[10px] text-slate-400">steps</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Weekly breakdown */}
                <div className="mt-4 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-700">Weekly Breakdown</h2>
                    {activeWeekIdx >= 0 && (
                      <span className="text-xs text-slate-400">
                        Active: <span className="font-medium text-slate-600">{weekLabels[activeWeekIdx]}</span>
                      </span>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-400 border-b border-slate-100">
                          <th className="text-left px-4 py-2.5 font-medium">Team</th>
                          {weekLabels.map((w, idx) => (
                            <th
                              key={w}
                              className={`text-right px-3 py-2.5 font-medium whitespace-nowrap ${idx === activeWeekIdx ? 'text-slate-700 bg-slate-50' : ''}`}
                            >
                              {w}
                            </th>
                          ))}
                          <th className="text-right px-4 py-2.5 font-medium">Total steps</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((team, i) => (
                          <tr key={team.teamName} className="border-b border-slate-50 last:border-0">
                            <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                              <span className="inline-block w-7 text-slate-400 text-xs tabular-nums">#{i + 1}</span>
                              {team.teamName}
                            </td>
                            {team.weeklySteps.map(({ label, steps }, idx) => (
                              <td
                                key={label}
                                className={`text-right px-3 py-3 tabular-nums whitespace-nowrap ${idx === activeWeekIdx ? 'text-slate-800 font-semibold bg-slate-50' : 'text-slate-500'}`}
                              >
                                {formatSteps(steps)}
                              </td>
                            ))}
                            <td className="text-right px-4 py-3 tabular-nums font-bold text-slate-900 whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <RankChangeBadge change={team.rankChange} />
                                {formatSteps(team.total)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            <p className="text-center text-[11px] text-slate-400 pt-2">
              Data sourced from Box · Updated manually by admin
            </p>
          </Tabs.Panel>

          {/* FAQ tab */}
          <Tabs.Panel value="faq">
            <Accordion.Root className="space-y-2">
              {FAQ.map((item) => (
                <Accordion.Item
                  key={item.q}
                  value={item.q}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                >
                  <Accordion.Header>
                    <Accordion.Trigger className="w-full flex items-center justify-between px-4 py-4 text-sm font-semibold text-slate-800 text-left gap-3 cursor-pointer">
                      {item.q}
                      <span className="text-slate-400 shrink-0 transition-transform duration-200 data-panel-open:rotate-180">
                        ▾
                      </span>
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel className="px-4 pb-4 text-sm text-slate-500 leading-relaxed">
                    {item.a}
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </Tabs.Panel>

        </Tabs.Root>
      </main>
    </div>
  );
}

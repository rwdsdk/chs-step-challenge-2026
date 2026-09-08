import { Fragment, useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { Accordion } from '@base-ui/react/accordion';
import { ArrowUp, ArrowDown, ChevronDown, X } from 'lucide-react';
import { useLeaderboard, type TeamRow } from '@/hooks/useLeaderboard';
import { CHALLENGE_NAME, CHALLENGE_MONTH, CHALLENGE_START, CHALLENGE_END } from '@/config';

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How are steps counted?',
    a: 'Steps are tracked via the StepUp app, which pulls your total step count from your respective health/fitness app automatically.',
  },
  {
    q: 'Why are my steps not updated?',
    a: 'The StepUp app reads from Apple Health or Google Fit. Make sure your phone is syncing steps to Apple Health or Google Fit, then open the StepUp app and sync to push your latest data. Please sync at least once a week to ensure your steps are counted in the challenge.',
  },
  {
    q: 'Why is the step breakdown different from my StepUp app?',
    a: 'One common reason is that the data is exported before some team members have synced their latest steps to the StepUp app. The exported data is a snapshot of the step counts at the time of export, so it may not reflect the most recent data from your app. It should sync within the next update cycle, but if you notice a persistent discrepancy, please reach out to the admins.',
  },
  {
    q: 'How often is the leaderboard updated?',
    a: "We will try our best to stick to a consistent schedule, but the leaderboard is only updated after the admins manually export the step count from each team. Check the 'Last updated' timestamp in the header for the most recent update.",
  },
  {
    q: 'How can I see the detailed breakdown for my team?',
    a: "Tap any team's card or row in the Rankings list to expand its week-by-week step breakdown.",
  },
];

function formatSteps(n: number): string {
  return n.toLocaleString();
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

type ChallengeStatus = 'upcoming' | 'live' | 'ended';

function getChallengeStatus(): ChallengeStatus {
  const now = new Date();
  const start = new Date(CHALLENGE_START);
  const end = new Date(CHALLENGE_END);
  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'live';
}

const STATUS_STYLES: Record<ChallengeStatus, { label: string; classes: string; dot: string }> = {
  upcoming: { label: 'Starts Soon', classes: 'bg-orange-500/10 text-orange-600 ring-orange-500/20', dot: 'bg-orange-500' },
  live: { label: 'Live', classes: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20', dot: 'bg-emerald-500' },
  ended: { label: 'Ended', classes: 'bg-rose-500/10 text-rose-600 ring-rose-500/20', dot: 'bg-rose-500' },
};

function RankChangeBadge({ change }: { change: number | null | undefined }) {
  if (change == null || change === 0) return null;
  const up = change > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums ${up ? 'text-emerald-600' : 'text-rose-500'}`}>
      {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}{Math.abs(change)}
    </span>
  );
}

const MEDAL_BADGE: Record<number, string> = {
  1: 'bg-linear-to-br from-amber-400 to-amber-600 text-white shadow-sm',
  2: 'bg-linear-to-br from-slate-300 to-slate-400 text-white shadow-sm',
  3: 'bg-linear-to-br from-[#c68a4e] to-[#8b5e34] text-white shadow-sm',
};

function RankNumeral({ rank, large }: { rank: number; large?: boolean }) {
  return (
    <span
      className={`flex items-center justify-center shrink-0 rounded-full font-bold ${large ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-[11px]'} ${MEDAL_BADGE[rank]}`}
    >
      {rank}
    </span>
  );
}

function TeamDetailPanel({ team, activeWeekIdx, onClose, exiting }: { team: TeamRow; activeWeekIdx: number; onClose: () => void; exiting?: boolean }) {
  return (
    <div className={`rounded-3xl bg-card border border-border shadow-sm overflow-hidden duration-100 ${
      exiting ? 'animate-out fade-out slide-out-to-top-2 fill-mode-forwards' : 'animate-in fade-in slide-in-from-top-2'
    }`}>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground truncate">{team.teamName}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
          aria-label="Close breakdown"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="px-4 py-3 space-y-2">
        {team.weeklySteps.map(({ label, steps }, idx) => (
          <div
            key={label}
            className={`flex items-center justify-between text-sm ${idx === activeWeekIdx ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
          >
            <span>{label}</span>
            <span className="tabular-nums">{formatSteps(steps)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between text-sm font-bold text-foreground pt-2 border-t border-border">
          <span>Total</span>
          <span className="tabular-nums flex items-center gap-1">
            <RankChangeBadge change={team.rankChange} />
            {formatSteps(team.total)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { data, weekLabels, generatedAt } = useLeaderboard();
  const hasData = data.length > 0;
  const challengeStatus = getChallengeStatus();
  const status = STATUS_STYLES[challengeStatus];
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [closingTeam, setClosingTeam] = useState<string | null>(null);

  const activeWeekIdx = weekLabels.reduce((best, _, idx) => {
    return data.some(t => (t.weeklySteps[idx]?.steps ?? 0) > 0) ? idx : best;
  }, -1);

  const detailTeamName = expandedTeam ?? closingTeam;
  const detailTeamData = data.find(t => t.teamName === detailTeamName) ?? null;
  const isClosing = !expandedTeam && !!closingTeam;

  const closeExpanded = () => {
    const teamName = expandedTeam;
    if (!teamName) return;
    setExpandedTeam(null);
    setClosingTeam(teamName);
    setTimeout(() => setClosingTeam(prev => (prev === teamName ? null : prev)), 100);
  };

  const toggleExpanded = (teamName: string) => {
    if (expandedTeam === teamName) {
      closeExpanded();
    } else {
      setClosingTeam(null);
      setExpandedTeam(teamName);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="bg-card/70 backdrop-blur-md border-b border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground leading-tight">
              {CHALLENGE_NAME}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{CHALLENGE_MONTH}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ring-1 ring-inset ${status.classes}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${challengeStatus === 'live' ? 'animate-pulse' : ''}`} />
              {status.label}
            </span>
            {generatedAt && (
              <span className="text-[10px] text-muted-foreground">
                <span>Last updated: </span>
                {formatDate(generatedAt)}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-12 overflow-hidden">
        <Tabs.Root defaultValue="ranking">

          {/* Tab list */}
          <Tabs.List className="flex gap-1 bg-card shadow-sm p-1 rounded-full mb-5">
            {(['ranking', 'faq'] as const).map((tab) => (
              <Tabs.Tab
                key={tab}
                value={tab}
                className="flex-1 py-2.5 text-sm font-semibold rounded-full text-muted-foreground transition-colors duration-150 cursor-pointer
                  data-active:bg-primary data-active:text-primary-foreground data-active:shadow-sm
                  not-data-active:hover:text-foreground"
              >
                {tab === 'ranking' ? 'Rankings' : 'FAQ'}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {/* Rankings tab */}
          <Tabs.Panel value="ranking" className="space-y-3">
            {!hasData ? (
              <div className="rounded-3xl border border-dashed border-border bg-card py-20 text-center text-sm text-muted-foreground">
                No data yet. Upload the xlsx to Box and run the deploy workflow.
              </div>
            ) : (
              <>
                {/* Top 3 podium */}
                <div className="mb-5">
                <div className="grid grid-cols-3 gap-2 w-full items-end">
                  {[1, 0, 2].map((idx) => {
                    const team = data[idx];
                    if (!team) return <div key={idx} />;
                    const rank = idx + 1;
                    const isFirst = rank === 1;
                    const thisWeekSteps = activeWeekIdx >= 0 ? team.weeklySteps[activeWeekIdx]?.steps ?? 0 : null;
                    const isExpanded = expandedTeam === team.teamName;
                    return (
                      <button
                        key={team.teamName}
                        type="button"
                        onClick={() => toggleExpanded(team.teamName)}
                        className={`flex flex-col items-center rounded-3xl bg-card shadow-sm text-center min-w-0 overflow-hidden cursor-pointer transition-shadow duration-150 ${
                          isExpanded ? 'ring-2 ring-primary' : ''
                        } ${isFirst ? 'px-2.5 pt-7 pb-5' : 'px-2.5 pt-5 pb-4'}`}
                      >
                        <RankNumeral rank={rank} large={isFirst} />
                        <span className={`mt-2 leading-snug line-clamp-2 min-h-8 flex items-center justify-center w-full px-1 text-foreground ${isFirst ? 'text-sm font-bold' : 'text-xs font-semibold'}`}>
                          {team.teamName}
                        </span>
                        <span className={`mt-1.5 font-bold tabular-nums text-foreground ${isFirst ? 'text-2xl' : 'text-lg'}`}>
                          {formatSteps(team.total)}
                        </span>
                        <span className="text-[9px] font-medium uppercase tracking-wide -mt-0.5 text-muted-foreground">
                          steps
                        </span>
                        {(thisWeekSteps !== null || (team.rankChange != null && team.rankChange !== 0)) && (
                          <div className="mt-1.5 flex items-center justify-center gap-1">
                            {thisWeekSteps !== null && (
                              <span className="text-[10px] tabular-nums text-muted-foreground">
                                {formatSteps(thisWeekSteps)} this wk
                              </span>
                            )}
                            <RankChangeBadge change={team.rankChange} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {detailTeamData && data.slice(0, 3).some(t => t.teamName === detailTeamData.teamName) && (
                  <div className="mt-3">
                    <TeamDetailPanel team={detailTeamData} activeWeekIdx={activeWeekIdx} onClose={closeExpanded} exiting={isClosing} />
                  </div>
                )}
                </div>

                {/* Ranks 4+ list */}
                <div className="space-y-2">
                  {data.slice(3).map((team, i) => {
                    const thisWeekSteps = activeWeekIdx >= 0 ? team.weeklySteps[activeWeekIdx]?.steps ?? 0 : null;
                    const isExpanded = expandedTeam === team.teamName;
                    return (
                      <Fragment key={team.teamName}>
                        <button
                          type="button"
                          onClick={() => toggleExpanded(team.teamName)}
                          className={`w-full flex items-center gap-3 bg-card rounded-3xl px-4 py-3 shadow-sm border cursor-pointer text-left ${
                            isExpanded ? 'border-primary ring-2 ring-primary' : 'border-border'
                          }`}
                        >
                          <span className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                            {i + 4}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-1.5">
                              <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 min-w-0">{team.teamName}</p>
                              <RankChangeBadge change={team.rankChange} />
                            </div>
                            {thisWeekSteps !== null && (
                              <p className="text-xs text-muted-foreground tabular-nums mt-0.5">{formatSteps(thisWeekSteps)} this week</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-base font-bold text-foreground tabular-nums">{formatSteps(team.total)}</p>
                            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">steps</p>
                          </div>
                          <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {detailTeamName === team.teamName && (
                          <TeamDetailPanel team={team} activeWeekIdx={activeWeekIdx} onClose={closeExpanded} exiting={isClosing} />
                        )}
                      </Fragment>
                    );
                  })}
                </div>
              </>
            )}
          </Tabs.Panel>

          {/* FAQ tab */}
          <Tabs.Panel value="faq">
            <Accordion.Root multiple className="space-y-2">
              {FAQ.map((item) => (
                <Accordion.Item
                  key={item.q}
                  value={item.q}
                  className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden"
                >
                  <Accordion.Header>
                    <Accordion.Trigger className="group w-full flex items-center justify-between px-4 py-4 text-sm font-semibold text-foreground text-left gap-3 cursor-pointer">
                      {item.q}
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 group-data-panel-open:rotate-180" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel className="overflow-hidden transition-[height] duration-200 ease-out h-(--accordion-panel-height) data-starting-style:h-0 data-ending-style:h-0">
                    <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {item.a}
                    </div>
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

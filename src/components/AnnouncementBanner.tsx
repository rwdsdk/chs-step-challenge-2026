import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import type { Announcement } from '@/hooks/useLeaderboard';
import { WEEK_BONUS_COLORS, bonusIcon } from '@/lib/bonusPalette';

function formatSteps(n: number): string {
  return n.toLocaleString();
}

function AnnouncementCard({ announcement, onDismiss }: { announcement: Announcement; onDismiss: () => void }) {
  if (!announcement.teams?.length) {
    // Plain-text fallback for a future non-bonus announcement.
    return <p className="text-xs text-foreground">{announcement.message}</p>;
  }

  const palette = WEEK_BONUS_COLORS[(announcement.weekIdx ?? 0) % WEEK_BONUS_COLORS.length];
  const Icon = bonusIcon(announcement.kind);

  return (
    <div className="flex items-start gap-3">
      <span className={`flex items-center justify-center shrink-0 w-9 h-9 rounded-full bg-card ring-1 ${palette.ring} shadow-sm`}>
        <Icon className={`w-4 h-4 ${palette.icon}`} />
      </span>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-foreground">{announcement.title}</span>
          <button
            type="button"
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {announcement.amount ? (
          <p className="text-[10px] text-muted-foreground mt-0.5">+{formatSteps(announcement.amount)} bonus steps to</p>
        ) : null}
        <ul className="mt-0.5 space-y-0.5">
          {announcement.teams.map((team) => (
            <li key={team} className="text-[11px] text-foreground">
              {team}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function AnnouncementBanner({
  announcements,
  onDismiss,
}: {
  announcements: Announcement[];
  onDismiss: (id: string) => void;
}) {
  const current = announcements[0];
  const palette = current ? WEEK_BONUS_COLORS[(current.weekIdx ?? 0) % WEEK_BONUS_COLORS.length] : null;

  return (
    <AnimatePresence mode="wait">
      {current && palette && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={`${palette.bannerBg} border-b ${palette.bannerBorder}`}
        >
          <div className="max-w-lg mx-auto px-4 py-3">
            <AnnouncementCard announcement={current} onDismiss={() => onDismiss(current.id)} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { Gift, SportShoe } from 'lucide-react';

// Per-week color palette for bonus badges/pills/banners — shared so every
// surface that shows a bonus (podium/list badges, detail-panel pills, the
// announcement banner) uses the exact same color for a given week.
export const WEEK_BONUS_COLORS = [
  { grad: 'to-amber-50/70', ring: 'ring-amber-300/50', icon: 'text-amber-600', bannerBg: 'bg-amber-50', bannerBorder: 'border-amber-200' },
  { grad: 'to-pink-50/70', ring: 'ring-pink-300/50', icon: 'text-pink-600', bannerBg: 'bg-pink-50', bannerBorder: 'border-pink-200' },
  { grad: 'to-violet-50/70', ring: 'ring-violet-300/50', icon: 'text-violet-600', bannerBg: 'bg-violet-50', bannerBorder: 'border-violet-200' },
  { grad: 'to-rose-50/70', ring: 'ring-rose-300/50', icon: 'text-rose-600', bannerBg: 'bg-rose-50', bannerBorder: 'border-rose-200' },
];

const BONUS_KIND_ICON = { event: Gift, improved: SportShoe } as const;
export function bonusIcon(kind: string | undefined) {
  return BONUS_KIND_ICON[kind as keyof typeof BONUS_KIND_ICON] ?? Gift;
}

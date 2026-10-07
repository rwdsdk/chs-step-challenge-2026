// Standard NEA/PSI bands. Status colors are the reserved 4-tier set (good/
// warning/serious/critical) — there's no 5th reserved color for "Hazardous,"
// so it shares "critical" with "Very Unhealthy" and is distinguished by its
// own label/icon instead of a fabricated 5th hue.
export interface PsiBand {
  label: string;
  statusKey: 'good' | 'warning' | 'serious' | 'critical';
  bg: string;
  text: string;
  ring: string;
  dot: string;
}

const BANDS: { max: number; band: PsiBand }[] = [
  { max: 50, band: { label: 'Good', statusKey: 'good', bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-300/60', dot: 'bg-green-500' } },
  { max: 100, band: { label: 'Moderate', statusKey: 'warning', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-300/60', dot: 'bg-amber-500' } },
  { max: 200, band: { label: 'Unhealthy', statusKey: 'serious', bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-300/60', dot: 'bg-orange-500' } },
  { max: 300, band: { label: 'Very Unhealthy', statusKey: 'critical', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-300/60', dot: 'bg-red-500' } },
  { max: Infinity, band: { label: 'Hazardous', statusKey: 'critical', bg: 'bg-red-100', text: 'text-red-800', ring: 'ring-red-400/60', dot: 'bg-red-600' } },
];

export function psiBand(value: number): PsiBand {
  return (BANDS.find((b) => value <= b.max) ?? BANDS[BANDS.length - 1]).band;
}

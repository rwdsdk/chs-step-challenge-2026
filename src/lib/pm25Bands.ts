// NEA 1-hour PM2.5 concentration bands (µg/m³).
export interface Pm25Band {
  label: string;
  bg: string;
  text: string;
  ring: string;
}

const BANDS: { max: number; band: Pm25Band }[] = [
  { max: 55, band: { label: 'Normal', bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-300/60' } },
  { max: 150, band: { label: 'Elevated', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-300/60' } },
  { max: 250, band: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-300/60' } },
  { max: Infinity, band: { label: 'Very High', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-300/60' } },
];

export function pm25Band(value: number): Pm25Band {
  return (BANDS.find((b) => value <= b.max) ?? BANDS[BANDS.length - 1]).band;
}

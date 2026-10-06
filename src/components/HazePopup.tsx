import { useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { useHazeData } from '@/hooks/useHazeData';
import { psiBand } from '@/lib/psiBands';

const HEADLINE_REGION = 'central';
const UNHEALTHY_ABOVE = 100; // PSI 101+ is the "Unhealthy" band
const STORAGE_KEY = 'chs-step-challenge-2026:haze-popup-hidden-on';

function todaySingapore(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' }).format(new Date());
}

function isHiddenToday(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === todaySingapore();
  } catch {
    return false;
  }
}

function hideForToday(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, todaySingapore());
  } catch {
    // Storage unavailable — it just reappears on the next load.
  }
}

export function HazePopup() {
  const { data } = useHazeData();
  const [closed, setClosed] = useState(() => isHiddenToday());
  // Focus the dialog box itself on open. The default is the first focusable
  // child, which is the haze.gov.sg link, so it showed a focus ring on open.
  const popupRef = useRef<HTMLDivElement>(null);

  const value = data?.psi[HEADLINE_REGION];
  const band = value != null ? psiBand(value) : null;
  const open = !closed && value != null && value > UNHEALTHY_ABOVE;

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) setClosed(true); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-30 bg-black/40 transition-opacity duration-150 data-starting-style:opacity-0 data-ending-style:opacity-0" />
        <Dialog.Popup ref={popupRef} initialFocus={popupRef} className="outline-none fixed left-1/2 top-1/2 z-40 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-card border border-border shadow-lg px-5 py-5 transition-opacity duration-150 data-starting-style:opacity-0 data-ending-style:opacity-0">
          <Dialog.Title className="text-base font-semibold text-foreground mb-2">Haze is unhealthy today</Dialog.Title>
          {band && (
            <p className="flex items-center gap-2 mb-3">
              <span className="text-2xl font-bold text-foreground">PSI {value}</span>
              <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ${band.bg} ${band.text} ${band.ring}`}>
                {band.label}
              </span>
            </p>
          )}
          <Dialog.Description className="text-sm text-muted-foreground leading-relaxed">
            Air quality is unhealthy today, we recommend getting your steps indoors. Try a treadmill,
            stairs, or laps around the office. Check{' '}
            <a href="https://www.haze.gov.sg" target="_blank" rel="noreferrer" className="text-foreground underline">
              haze.gov.sg
            </a>{' '}
            for the latest advice.
          </Dialog.Description>
          <div className="mt-5 flex flex-col gap-2">
            <Dialog.Close className="w-full rounded-full bg-primary text-primary-foreground text-sm font-semibold py-2.5 cursor-pointer">
              Got it
            </Dialog.Close>
            <button
              type="button"
              onClick={() => { hideForToday(); setClosed(true); }}
              className="w-full text-xs font-medium text-muted-foreground hover:text-foreground py-1.5 cursor-pointer"
            >
              Don't show again today
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

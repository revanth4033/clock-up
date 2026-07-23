"use client";

import { useSyncExternalStore } from "react";
import { ProgressRing } from "./progress-ring";
import { formatMinutes, toPercent } from "@/utils/format";

/** Ticking clock: re-renders every second; getSnapshot reads the current time.
 * Returns 0 during SSR / pre-hydration (stable, no mismatch). */
function subscribe(callback: () => void) {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id);
}
function useNow() {
  return useSyncExternalStore(
    subscribe,
    () => Date.now(),
    () => 0,
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Live working timer + progress ring, driven entirely by the stored server
 * clock-in (BRD §10 — survives refresh/close, no server-side timer needed). */
export function LiveWorkingHours({
  clockInIso,
  goalMinutes,
}: {
  clockInIso: string;
  goalMinutes: number;
}) {
  const now = useNow();

  if (now === 0) {
    return (
      <div className="flex flex-col items-center gap-5">
        <ProgressRing value={0} max={goalMinutes}>
          <span className="font-heading text-2xl font-bold tabular-nums">
            --:--:--
          </span>
        </ProgressRing>
      </div>
    );
  }

  const elapsedSec = Math.max(
    0,
    Math.floor((now - new Date(clockInIso).getTime()) / 1000),
  );
  const elapsedMin = Math.floor(elapsedSec / 60);
  const timer = `${pad(Math.floor(elapsedSec / 3600))}:${pad(
    Math.floor((elapsedSec % 3600) / 60),
  )}:${pad(elapsedSec % 60)}`;
  const percent = toPercent(elapsedMin, goalMinutes);
  const remaining = Math.max(0, goalMinutes - elapsedMin);

  return (
    <div className="flex flex-col items-center gap-5">
      <ProgressRing value={elapsedMin} max={goalMinutes}>
        <span className="font-heading text-2xl font-bold tabular-nums">
          {timer}
        </span>
        <span className="text-muted-foreground mt-0.5 text-xs">
          {percent}% of {formatMinutes(goalMinutes)}
        </span>
      </ProgressRing>
      <div className="grid w-full grid-cols-2 gap-2 text-center">
        <div>
          <p className="font-heading text-lg font-bold tabular-nums">
            {formatMinutes(elapsedMin)}
          </p>
          <p className="text-muted-foreground text-xs">Worked so far</p>
        </div>
        <div>
          <p className="font-heading text-lg font-bold tabular-nums">
            {formatMinutes(remaining)}
          </p>
          <p className="text-muted-foreground text-xs">Remaining</p>
        </div>
      </div>
    </div>
  );
}

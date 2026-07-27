"use client";

import { useSyncExternalStore } from "react";

/**
 * A single shared 1-second clock exposed as an external store. `getSnapshot`
 * returns a CACHED timestamp that changes only when the interval ticks, so the
 * value is stable between notifications — the contract `useSyncExternalStore`
 * requires. (Returning a fresh `Date.now()` on every call is seen as a change
 * on every render, which drives an infinite re-render loop.) `getServerSnapshot`
 * returns 0 → the SSR / pre-hydration placeholder.
 *
 * The store is module-scoped, so every consumer (the Working Hours ring and the
 * Today's Work hero) subscribes to the SAME interval — the dashboard ticks in
 * lock-step with no extra timers.
 */
let currentNow = Date.now();
const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function subscribe(callback: () => void) {
  listeners.add(callback);
  if (intervalId === null) {
    currentNow = Date.now();
    intervalId = setInterval(() => {
      currentNow = Date.now();
      for (const listener of listeners) listener();
    }, 1000);
  }
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

/** Current epoch-ms, ticking once a second; 0 during SSR / before hydration. */
export function useNow() {
  return useSyncExternalStore(
    subscribe,
    () => currentNow,
    () => 0,
  );
}

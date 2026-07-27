"use client";

import { useSyncExternalStore } from "react";
import { APP_TIME_ZONE } from "@/constants/timezone";

const subscribe = () => () => {};

/** True on the client after hydration, false during SSR/first paint — the
 * React-recommended way to render client-only content without a mismatch. */
function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Greeting + current date in the viewer's local timezone. Rendered client-only
 * so it's correct for the user (and free of hydration mismatches). The name
 * comes from the server.
 */
export function GreetingLine({ name }: { name: string }) {
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <div className="space-y-2">
        <div className="bg-muted h-7 w-56 animate-pulse rounded" />
        <div className="bg-muted h-4 w-40 animate-pulse rounded" />
      </div>
    );
  }

  const now = new Date();
  const firstName = name.split(" ")[0] || name;
  // Hour + date in the application timezone (not the viewer's), so the greeting
  // and date stay consistent with the server-rendered clock times.
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: APP_TIME_ZONE,
    }).format(now),
  );
  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(now);

  return (
    <div>
      <p className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
        {greetingFor(hour)}, {firstName} 👋
      </p>
      <p className="text-muted-foreground text-sm">{date}</p>
    </div>
  );
}

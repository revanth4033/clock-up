import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Stat } from "../stat";

/** Semantic status tones — the coloured dot carries the meaning, the label
 * stays high-contrast for readability. */
export type Tone = "neutral" | "info" | "accent" | "success" | "warning";

const DOT: Record<Tone, string> = {
  neutral: "bg-muted-foreground",
  info: "bg-info",
  accent: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
};

/** LARGE emphasis — "what is happening right now?" */
export function HeroStatus({ tone, label }: { tone: Tone; label: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className={cn("size-2.5 rounded-full", DOT[tone])} aria-hidden />
      <h3 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
        {label}
      </h3>
    </div>
  );
}

/** MEDIUM emphasis — the essential numbers for the current state. */
export function HeroMetrics({
  items,
}: {
  items: { value: ReactNode; label: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-4">
      {items.map((m) => (
        <Stat
          key={m.label}
          value={m.value}
          label={m.label}
          className="text-center"
        />
      ))}
    </div>
  );
}

/** LOW emphasis — supporting message, credits, rewards. */
export function HeroSupporting({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground text-xs">{children}</p>;
}

/** LOW emphasis — GPS requirement for the clock action. */
export function LocationHint() {
  return (
    <HeroSupporting>
      <span className="inline-flex items-center gap-1">
        <MapPin className="size-3" />
        Requires your office location
      </span>
    </HeroSupporting>
  );
}

/**
 * The fixed hero skeleton. The layout NEVER changes across states — only the
 * nodes passed in do — enforcing the approved hierarchy top-to-bottom:
 * Status → Metrics → Primary Action → Supporting. The action always renders
 * before the supporting text so it stays visually dominant.
 */
export function HeroBody({
  status,
  metrics,
  action,
  supporting,
}: {
  status: ReactNode;
  metrics: ReactNode;
  action: ReactNode;
  supporting: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 py-2 text-center">
      {status}
      {metrics}
      <div className="w-full sm:w-auto">{action}</div>
      {supporting}
    </div>
  );
}

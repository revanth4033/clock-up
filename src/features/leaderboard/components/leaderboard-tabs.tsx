import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LeaderboardPeriod } from "@/services/leaderboard.service";

const TABS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

/** Period tabs rendered as links (navigation resets to page 1). */
export function LeaderboardTabs({ period }: { period: LeaderboardPeriod }) {
  return (
    <div
      role="tablist"
      aria-label="Leaderboard period"
      className="border-border bg-card inline-flex flex-wrap gap-1 rounded-xl border p-1"
    >
      {TABS.map((tab) => {
        const active = tab.value === period;
        return (
          <Link
            key={tab.value}
            href={`/leaderboard?period=${tab.value}`}
            role="tab"
            aria-selected={active}
            className={cn(
              "focus-visible:ring-ring rounded-lg px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

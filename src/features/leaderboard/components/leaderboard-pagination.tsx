import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardPeriod } from "@/services/leaderboard.service";

const LINK =
  "inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted";
const DISABLED = "pointer-events-none opacity-50";

export function LeaderboardPagination({
  period,
  page,
  totalPages,
}: {
  period: LeaderboardPeriod;
  page: number;
  totalPages: number;
}) {
  const href = (p: number) => `/leaderboard?period=${period}&page=${p}`;

  return (
    <div className="flex items-center justify-between">
      <p className="text-muted-foreground text-xs">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Link
          href={href(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={cn(LINK, page <= 1 && DISABLED)}
        >
          <ChevronLeft className="size-4" />
          Prev
        </Link>
        <Link
          href={href(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={cn(LINK, page >= totalPages && DISABLED)}
        >
          Next
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

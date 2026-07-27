import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { ENABLE_CREDIT_REDEMPTION, ENABLE_TIME_CREDITS } from "@/lib/flags";

/**
 * Mirrors the dashboard grid exactly — the full-width hero, the stacked middle
 * column (Attendance + This Week), the flag-gated credit cards, and the
 * half-and-half reference row — so the skeleton→content transition has no
 * layout shift. Kept in lock-step with `page.tsx`.
 */
export default function DashboardLoading() {
  const credits = ENABLE_TIME_CREDITS;
  const redemption = ENABLE_TIME_CREDITS && ENABLE_CREDIT_REDEMPTION;

  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
        {/* Greeting header */}
        <Skeleton className="h-28 rounded-2xl md:col-span-2 xl:col-span-3" />
        {/* Today's Work hero */}
        <Skeleton className="h-56 rounded-2xl md:col-span-2 xl:col-span-3" />

        {/* Row 1 — Working Hours | (Attendance + This Week) | Time Credits.
            Third slot is Time Credits when credits are on, else Points. */}
        <Skeleton className="h-72 rounded-2xl" />
        <div className="flex flex-col gap-4 md:gap-5">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />

        {/* Row 2 — Redeem | Credit Balance | Points (only when credits are on;
            when off, Points already occupies the Row-1 third slot above). */}
        {redemption && <Skeleton className="h-52 rounded-2xl" />}
        {credits && <Skeleton className="h-52 rounded-2xl" />}
        {credits && <Skeleton className="h-52 rounded-2xl" />}

        {/* Row 3 — Leaderboard + Recent Attendance, half & half */}
        <div className="grid grid-cols-1 gap-4 md:col-span-2 md:gap-5 lg:grid-cols-2 xl:col-span-3">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    </PageContainer>
  );
}

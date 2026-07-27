import { Coins } from "lucide-react";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { Stat } from "@/features/dashboard/components/stat";
import { ProgressBar } from "@/features/dashboard/components/progress-bar";
import { isRestDay } from "@/features/dashboard/lib/rest-day";
import { formatMinutes } from "@/utils/format";
import type { DayType, TodaySummary } from "@/types/domain";

/**
 * Today's Time Credit breakdown. Goal progress is driven by Counted Time
 * (Worked + Applied Redeemed). On a rest day it shows a calm "no goal" state,
 * consistent with the rest of the Today's Work section.
 */
export function TodayCreditsCard({
  today,
  dayType,
  className,
}: {
  today: TodaySummary;
  dayType: DayType;
  className?: string;
}) {
  const started = today.status !== "not_started";

  if (isRestDay(dayType, started)) {
    return (
      <DashboardCard
        title="Today's Time Credits"
        icon={Coins}
        className={className}
        contentClassName="space-y-1"
      >
        <p className="font-heading text-lg font-bold">No goal today</p>
        <p className="text-muted-foreground text-sm">
          No credits to earn on a day off.
        </p>
      </DashboardCard>
    );
  }

  const percent = Math.round(today.goalProgress * 100);

  return (
    <DashboardCard
      title="Today's Time Credits"
      icon={Coins}
      className={className}
      contentClassName="space-y-4"
    >
      {/* Goal progress — the card's headline */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-muted-foreground text-xs">Goal progress</p>
          <p className="font-heading text-sm font-semibold tabular-nums">
            {percent}%
          </p>
        </div>
        <ProgressBar value={percent} />
      </div>

      {/* How the goal is met — Worked & Redeemed lead into the Counted result,
          set apart by a divider (relationship shown through layout). */}
      <div className="grid grid-cols-3 gap-3">
        <Stat value={formatMinutes(today.workedMinutes)} label="Worked" />
        <Stat value={today.redeemedCredits} label="Redeemed" />
        <Stat
          value={formatMinutes(today.countedMinutes)}
          label="Counted"
          className="border-l pl-3"
        />
      </div>

      {/* Rewards — secondary group */}
      <div className="grid grid-cols-2 gap-3 border-t pt-4">
        <Stat value={today.points} label="Points" />
        <Stat value={today.earnedCredits} label="Earned" />
      </div>
    </DashboardCard>
  );
}

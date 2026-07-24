import { Coins } from "lucide-react";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { Stat } from "@/features/dashboard/components/stat";
import { ProgressBar } from "@/features/dashboard/components/progress-bar";
import { formatMinutes } from "@/utils/format";
import type { TodaySummary } from "@/types/domain";

/**
 * Today's Time Credit breakdown. Goal progress here is explicitly driven by
 * Counted Time (Worked + Applied Redeemed), not Worked alone — see the label.
 */
export function TodayCreditsCard({
  today,
  className,
}: {
  today: TodaySummary;
  className?: string;
}) {
  const percent = Math.round(today.goalProgress * 100);

  return (
    <DashboardCard
      title="Today's Time Credits"
      icon={Coins}
      className={className}
      contentClassName="space-y-4"
    >
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-muted-foreground text-xs">
            Goal progress · Counted Time
          </p>
          <p className="font-heading text-sm font-semibold tabular-nums">
            {formatMinutes(today.countedMinutes)} /{" "}
            {formatMinutes(today.goalMinutes)}
          </p>
        </div>
        <ProgressBar value={percent} />
        <p className="text-muted-foreground text-xs tabular-nums">
          {percent}% of today&apos;s goal
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat value={formatMinutes(today.workedMinutes)} label="Worked" />
        <Stat value={today.redeemedCredits} label="Redeemed credits" />
        <Stat value={formatMinutes(today.countedMinutes)} label="Counted" />
        <Stat value={today.points} label="Today's points" />
        <Stat value={today.earnedCredits} label="Earned credits" />
      </div>
    </DashboardCard>
  );
}

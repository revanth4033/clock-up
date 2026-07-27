import { CalendarDays } from "lucide-react";
import { DashboardCard } from "./dashboard-card";
import { ProgressBar } from "./progress-bar";
import { Stat } from "./stat";
import { formatMinutes, toPercent } from "@/utils/format";
import type { DashboardData } from "@/services/dashboard.service";

export function WeeklySummaryCard({
  weekly,
  className,
}: {
  weekly: DashboardData["weekly"];
  className?: string;
}) {
  const percent = toPercent(weekly.totalMinutes, weekly.goalMinutes);

  return (
    <DashboardCard title="This Week" icon={CalendarDays} className={className}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat value={weekly.daysPresent} label="Days present" />
          <Stat value={formatMinutes(weekly.totalMinutes)} label="Hours" />
          <Stat value={formatMinutes(weekly.averageMinutes)} label="Average" />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Weekly progress</span>
            <span className="text-foreground font-semibold tabular-nums">
              {percent}%
            </span>
          </div>
          <ProgressBar value={percent} />
        </div>
      </div>
    </DashboardCard>
  );
}

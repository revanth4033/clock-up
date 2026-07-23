import { BarChart3 } from "lucide-react";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { Stat } from "@/features/dashboard/components/stat";
import { formatMinutes } from "@/utils/format";
import type { UserStats } from "@/types/domain";

/**
 * All-time attendance statistics, read straight from the `v_user_stats` view.
 * Nothing is recomputed here — the UI only formats the pre-aggregated numbers.
 */
export function AttendanceStatsCard({ stats }: { stats: UserStats }) {
  const hasActivity = stats.totalWorkingDays > 0;

  return (
    <DashboardCard title="Attendance Statistics" icon={BarChart3}>
      {hasActivity ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat value={stats.totalWorkingDays} label="Working days" />
          <Stat value={stats.totalCompletedDays} label="Days Present" />
          <Stat value={stats.totalPoints} label="Total points" />
          <Stat
            value={formatMinutes(stats.totalWorkedMinutes)}
            label="Total hours"
          />
          <Stat
            value={formatMinutes(stats.avgWorkedMinutes)}
            label="Avg / day"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 py-8 text-center">
          <p className="text-sm font-medium">No statistics yet</p>
          <p className="text-muted-foreground max-w-xs text-xs">
            Clock in to start building your working history and points.
          </p>
        </div>
      )}
    </DashboardCard>
  );
}

import { Activity } from "lucide-react";
import { DashboardCard } from "./dashboard-card";
import { AttendanceStatusBadge } from "./attendance-status-badge";
import { formatTimeOfDay } from "@/utils/format";
import type { DashboardData } from "@/services/dashboard.service";

export function AttendanceStatusCard({
  today,
  className,
}: {
  today: DashboardData["today"];
  className?: string;
}) {
  return (
    <DashboardCard
      title="Today's Attendance"
      icon={Activity}
      className={className}
    >
      <div className="flex flex-col gap-3">
        <AttendanceStatusBadge state={today.state} className="h-6 text-sm" />
        {today.state === "not_started" ? (
          <p className="text-muted-foreground text-sm">
            You haven&apos;t clocked in yet today.
          </p>
        ) : (
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Clock in</p>
              <p className="font-medium tabular-nums">
                {formatTimeOfDay(today.clockIn)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Clock out</p>
              <p className="font-medium tabular-nums">
                {formatTimeOfDay(today.clockOut)}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}

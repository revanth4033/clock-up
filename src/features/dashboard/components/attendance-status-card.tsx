import { Activity, ArrowRight } from "lucide-react";
import { DashboardCard } from "./dashboard-card";
import { AttendanceStatusBadge } from "./attendance-status-badge";
import { Stat } from "./stat";
import { Badge } from "@/components/ui/badge";
import { isRestDay } from "../lib/rest-day";
import { formatTimeOfDay } from "@/utils/format";
import type { DashboardData } from "@/services/dashboard.service";

export function AttendanceStatusCard({
  today,
  className,
}: {
  today: DashboardData["today"];
  className?: string;
}) {
  const started = today.state !== "not_started";

  return (
    <DashboardCard
      title="Today's Attendance"
      icon={Activity}
      className={className}
    >
      <div className="flex flex-col gap-4">
        {isRestDay(today.dayType, started) ? (
          <>
            <Badge className="bg-muted text-muted-foreground h-6 w-fit border-transparent text-sm">
              Day off
            </Badge>
            <p className="text-muted-foreground text-sm">
              No attendance required today.
            </p>
          </>
        ) : (
          <>
            <AttendanceStatusBadge
              state={today.state}
              className="h-6 w-fit text-sm"
            />
            {today.state === "not_started" ? (
              <p className="text-muted-foreground text-sm">
                You haven&apos;t clocked in yet today.
              </p>
            ) : (
              <div className="flex items-center gap-4">
                <Stat value={formatTimeOfDay(today.clockIn)} label="Clock in" />
                <ArrowRight className="text-muted-foreground size-4 shrink-0 -translate-y-2" />
                <Stat
                  value={formatTimeOfDay(today.clockOut)}
                  label="Clock out"
                />
              </div>
            )}
          </>
        )}
      </div>
    </DashboardCard>
  );
}

import { Clock } from "lucide-react";
import { DashboardCard } from "./dashboard-card";
import { ProgressRing } from "./progress-ring";
import { LiveWorkingHours } from "./live-working-hours";
import { formatMinutes, toPercent } from "@/utils/format";
import type { DashboardData } from "@/services/dashboard.service";

export function WorkingHoursCard({
  today,
  workingHours,
  className,
}: {
  today: DashboardData["today"];
  workingHours: DashboardData["workingHours"];
  className?: string;
}) {
  const { workedMinutes, goalMinutes } = workingHours;
  const percent = toPercent(workedMinutes, goalMinutes);
  const remaining = Math.max(0, goalMinutes - workedMinutes);

  return (
    <DashboardCard title="Working Hours" icon={Clock} className={className}>
      {today.state === "working" && today.clockIn ? (
        <LiveWorkingHours
          clockInIso={today.clockIn}
          goalMinutes={goalMinutes}
        />
      ) : (
        <div className="flex flex-col items-center gap-5">
          <ProgressRing value={workedMinutes} max={goalMinutes}>
            <span className="font-heading text-3xl font-bold tabular-nums">
              {percent}%
            </span>
            <span className="text-muted-foreground mt-0.5 text-xs">
              of {formatMinutes(goalMinutes)}
            </span>
          </ProgressRing>
          <div className="grid w-full grid-cols-2 gap-2 text-center">
            <div>
              <p className="font-heading text-lg font-bold tabular-nums">
                {formatMinutes(workedMinutes)}
              </p>
              <p className="text-muted-foreground text-xs">Worked today</p>
            </div>
            <div>
              <p className="font-heading text-lg font-bold tabular-nums">
                {formatMinutes(remaining)}
              </p>
              <p className="text-muted-foreground text-xs">Remaining</p>
            </div>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}

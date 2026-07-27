import { Clock, Moon } from "lucide-react";
import { DashboardCard } from "./dashboard-card";
import { ProgressRing } from "./progress-ring";
import { LiveWorkingHours } from "./live-working-hours";
import { Stat } from "./stat";
import { isRestDay } from "../lib/rest-day";
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
  const started = today.state !== "not_started";

  return (
    <DashboardCard title="Working Hours" icon={Clock} className={className}>
      {isRestDay(today.dayType, started) ? (
        // Rest day — muted, track-only ring keeps the card's shape without
        // implying an unmet goal.
        <div className="flex flex-col items-center gap-4">
          <ProgressRing value={0} max={goalMinutes} trackOnly>
            <Moon className="text-muted-foreground size-7" />
          </ProgressRing>
          <div className="text-center">
            <p className="font-heading text-lg font-bold">Rest day</p>
            <p className="text-muted-foreground text-xs">
              No hours expected today.
            </p>
          </div>
        </div>
      ) : today.state === "working" && today.clockIn ? (
        <LiveWorkingHours
          clockInIso={today.clockIn}
          goalMinutes={goalMinutes}
        />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <ProgressRing value={workedMinutes} max={goalMinutes}>
            <span className="font-heading text-3xl font-bold tabular-nums">
              {toPercent(workedMinutes, goalMinutes)}%
            </span>
            <span className="text-muted-foreground mt-0.5 text-xs">
              of {formatMinutes(goalMinutes)}
            </span>
          </ProgressRing>
          <div className="grid w-full grid-cols-2 gap-2 text-center">
            <Stat value={formatMinutes(workedMinutes)} label="Worked" />
            <Stat
              value={formatMinutes(Math.max(0, goalMinutes - workedMinutes))}
              label="Remaining"
            />
          </div>
        </div>
      )}
    </DashboardCard>
  );
}

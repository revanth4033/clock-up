import Link from "next/link";
import { History } from "lucide-react";
import { DashboardCard } from "./dashboard-card";
import { AttendanceStatusBadge } from "./attendance-status-badge";
import { cn } from "@/lib/utils";
import {
  formatMinutes,
  formatShortDate,
  formatTimeOfDay,
} from "@/utils/format";
import type { DashboardData } from "@/services/dashboard.service";

export function RecentAttendanceCard({
  recent,
  todayWorkDate,
  className,
}: {
  recent: DashboardData["recent"];
  /** Today's UTC work-date; when provided, that row is highlighted. Omitted on
   * the Profile page (shared component), where the "Today" cue isn't wanted. */
  todayWorkDate?: string;
  className?: string;
}) {
  return (
    <DashboardCard
      title="Recent Attendance"
      icon={History}
      className={className}
      action={
        recent.length > 0 ? (
          <Link
            href="/attendance"
            className="text-primary focus-visible:ring-ring/50 rounded-sm text-xs font-medium outline-none hover:underline focus-visible:ring-3"
          >
            View all
          </Link>
        ) : undefined
      }
    >
      {recent.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-8 text-center">
          <p className="text-sm font-medium">No attendance yet</p>
          <p className="text-muted-foreground max-w-xs text-xs">
            Your work sessions will appear here once you start clocking in.
          </p>
        </div>
      ) : (
        <ul className="divide-border divide-y">
          {recent.map((record) => {
            const isToday = record.workDate === todayWorkDate;
            // Completed is the norm — a badge on every row is noise. Only flag
            // the exceptions (missed / incomplete) that actually need attention.
            const isException =
              record.status === "missed_clock_out" ||
              record.status === "incomplete";
            return (
              <li
                key={record.id}
                className={cn(
                  "flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0",
                  isToday && "bg-primary/[0.04]",
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {formatShortDate(record.workDate)}
                    </p>
                    {isToday && (
                      <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[0.625rem] leading-none font-semibold">
                        Today
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                    {formatTimeOfDay(record.clockIn)} –{" "}
                    {formatTimeOfDay(record.clockOut)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums">
                    {record.workedMinutes != null
                      ? formatMinutes(record.workedMinutes)
                      : "—"}
                  </span>
                  {isException && (
                    <AttendanceStatusBadge state={record.status} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}

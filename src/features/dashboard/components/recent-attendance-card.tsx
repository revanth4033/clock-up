import Link from "next/link";
import { History } from "lucide-react";
import { DashboardCard } from "./dashboard-card";
import { AttendanceStatusBadge } from "./attendance-status-badge";
import {
  formatMinutes,
  formatShortDate,
  formatTimeOfDay,
} from "@/utils/format";
import type { DashboardData } from "@/services/dashboard.service";

export function RecentAttendanceCard({
  recent,
  className,
}: {
  recent: DashboardData["recent"];
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
            className="text-primary text-xs font-medium hover:underline"
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
          {recent.map((record) => (
            <li
              key={record.id}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {formatShortDate(record.workDate)}
                </p>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {formatTimeOfDay(record.clockIn)} –{" "}
                  {formatTimeOfDay(record.clockOut)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-medium tabular-nums">
                  {record.workedMinutes != null
                    ? formatMinutes(record.workedMinutes)
                    : "—"}
                </span>
                <AttendanceStatusBadge state={record.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}

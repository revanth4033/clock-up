import { Zap } from "lucide-react";
import { DashboardCard } from "./dashboard-card";
import { ClockActions } from "@/features/attendance/components/clock-actions";
import type { TodayState } from "@/services/dashboard.service";

/** Clock In / Clock Out actions (activated by the Attendance engine). */
export function QuickActionsCard({
  state,
  className,
}: {
  state: TodayState;
  className?: string;
}) {
  return (
    <DashboardCard title="Quick Actions" icon={Zap} className={className}>
      <ClockActions state={state} />
    </DashboardCard>
  );
}

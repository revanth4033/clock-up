import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TodayState } from "@/services/dashboard.service";

const CONFIG: Record<TodayState, { label: string; className: string }> = {
  not_started: {
    label: "Not Started",
    className: "bg-muted text-muted-foreground",
  },
  working: { label: "Working", className: "bg-info/10 text-info" },
  completed: { label: "Completed", className: "bg-success/10 text-success" },
  missed_clock_out: {
    label: "Missed Clock Out",
    className: "bg-warning/10 text-warning",
  },
  incomplete: { label: "Incomplete", className: "bg-warning/10 text-warning" },
};

/** Colored badge for an attendance state (semantic colors, DSD §8). */
export function AttendanceStatusBadge({
  state,
  className,
}: {
  state: TodayState;
  className?: string;
}) {
  const config = CONFIG[state];
  return (
    <Badge className={cn("border-transparent", config.className, className)}>
      {config.label}
    </Badge>
  );
}

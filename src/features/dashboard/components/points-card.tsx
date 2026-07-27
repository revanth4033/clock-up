import { Sparkles } from "lucide-react";
import { DashboardCard } from "./dashboard-card";
import { Stat } from "./stat";
import type { DashboardData } from "@/services/dashboard.service";

export function PointsCard({
  points,
  className,
}: {
  points: DashboardData["points"];
  className?: string;
}) {
  return (
    <DashboardCard title="Points" icon={Sparkles} className={className}>
      <div className="grid grid-cols-3 gap-3">
        <Stat value={points.today} label="Today" size="lg" />
        <Stat value={points.week} label="This week" size="lg" />
        <Stat value={points.total} label="Total" size="lg" />
      </div>
    </DashboardCard>
  );
}

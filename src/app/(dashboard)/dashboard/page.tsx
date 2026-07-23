import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { getDashboardData } from "@/services/dashboard.service";
import { WelcomeCard } from "@/features/dashboard/components/welcome-card";
import { WorkingHoursCard } from "@/features/dashboard/components/working-hours-card";
import { AttendanceStatusCard } from "@/features/dashboard/components/attendance-status-card";
import { PointsCard } from "@/features/dashboard/components/points-card";
import { WeeklySummaryCard } from "@/features/dashboard/components/weekly-summary-card";
import { QuickActionsCard } from "@/features/dashboard/components/quick-actions-card";
import { LeaderboardPreviewCard } from "@/features/dashboard/components/leaderboard-preview-card";
import { RecentAttendanceCard } from "@/features/dashboard/components/recent-attendance-card";
import { MissedClockOutDialog } from "@/features/attendance/components/missed-clock-out-dialog";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <PageContainer>
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-center">
          <p className="text-lg font-semibold">
            We couldn&apos;t load your profile
          </p>
          <p className="text-muted-foreground text-sm">
            Please sign out and sign in again.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 className="sr-only">Dashboard</h1>
      {data.pendingRecovery && (
        <MissedClockOutDialog recovery={data.pendingRecovery} />
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
        <WelcomeCard
          name={data.profile.fullName}
          designation={data.profile.designation}
          officeName={data.profile.officeName}
          className="rounded-2xl md:col-span-2 xl:col-span-3"
        />

        <WorkingHoursCard today={data.today} workingHours={data.workingHours} />

        <div className="flex flex-col gap-4 md:gap-5">
          <AttendanceStatusCard today={data.today} />
          <PointsCard points={data.points} />
        </div>

        <div className="flex flex-col gap-4 md:gap-5">
          <WeeklySummaryCard weekly={data.weekly} />
          <QuickActionsCard state={data.today.state} />
        </div>

        <LeaderboardPreviewCard leaderboard={data.leaderboard} />

        <RecentAttendanceCard
          recent={data.recent}
          className="md:col-span-2 xl:col-span-2"
        />
      </div>
    </PageContainer>
  );
}

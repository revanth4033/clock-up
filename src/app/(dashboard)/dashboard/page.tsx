import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { getDashboardData } from "@/services/dashboard.service";
import {
  getCreditSummary,
  getTodayRedemption,
  getTodaySummary,
} from "@/services/presentation.service";
import { ENABLE_CREDIT_REDEMPTION, ENABLE_TIME_CREDITS } from "@/lib/flags";
import { WelcomeCard } from "@/features/dashboard/components/welcome-card";
import { WorkingHoursCard } from "@/features/dashboard/components/working-hours-card";
import { AttendanceStatusCard } from "@/features/dashboard/components/attendance-status-card";
import { PointsCard } from "@/features/dashboard/components/points-card";
import { WeeklySummaryCard } from "@/features/dashboard/components/weekly-summary-card";
import { TodayWorkCard } from "@/features/dashboard/components/today-work-card";
import { LeaderboardPreviewCard } from "@/features/dashboard/components/leaderboard-preview-card";
import { RecentAttendanceCard } from "@/features/dashboard/components/recent-attendance-card";
import { TodayCreditsCard } from "@/features/credits/components/today-credits-card";
import { CreditBalanceCard } from "@/features/credits/components/credit-balance-card";
import { RedeemCard } from "@/features/credits/components/redeem-card";
import { MissedClockOutDialog } from "@/features/attendance/components/missed-clock-out-dialog";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [data, creditData] = await Promise.all([
    getDashboardData(),
    ENABLE_TIME_CREDITS
      ? Promise.all([
          getTodaySummary(),
          getCreditSummary(),
          getTodayRedemption(),
        ])
      : Promise.resolve(null),
  ]);

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

  const credits =
    creditData && creditData[0] && creditData[1] && creditData[2]
      ? {
          today: creditData[0],
          credit: creditData[1],
          redemption: creditData[2],
        }
      : null;

  return (
    <PageContainer>
      <h1 className="sr-only">Dashboard</h1>
      {data.pendingRecovery && (
        <MissedClockOutDialog recovery={data.pendingRecovery} />
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
        {/* Greeting & context — the page header */}
        <WelcomeCard
          name={data.profile.fullName}
          designation={data.profile.designation}
          officeName={data.profile.officeName}
          className="rounded-2xl md:col-span-2 xl:col-span-3"
        />

        {/* Priority 1 — the employee's primary action, first and most prominent */}
        <TodayWorkCard
          today={data.today}
          workingHours={data.workingHours}
          points={data.points}
          creditToday={credits?.today ?? null}
          className="md:col-span-2 xl:col-span-3"
        />

        {/* Row 1 — today's work (Today's Attendance + This Week stacked in the middle) */}
        <WorkingHoursCard today={data.today} workingHours={data.workingHours} />
        <div className="flex flex-col gap-4 md:gap-5">
          <AttendanceStatusCard today={data.today} />
          <WeeklySummaryCard weekly={data.weekly} />
        </div>
        {credits && (
          <TodayCreditsCard
            today={credits.today}
            dayType={data.today.dayType}
          />
        )}

        {/* Row 2 — Redeem Credits · Credit Balance · Points */}
        {credits && ENABLE_CREDIT_REDEMPTION && (
          <RedeemCard
            today={credits.today}
            credit={credits.credit}
            redemption={credits.redemption}
            dayType={data.today.dayType}
          />
        )}
        {credits && <CreditBalanceCard credit={credits.credit} />}
        <PointsCard points={data.points} />

        {/* Row 3 — reference tables, half & half across the full width */}
        <div className="grid grid-cols-1 gap-4 md:col-span-2 md:gap-5 lg:grid-cols-2 xl:col-span-3">
          <LeaderboardPreviewCard leaderboard={data.leaderboard} />
          <RecentAttendanceCard
            recent={data.recent}
            todayWorkDate={data.todayWorkDate}
          />
        </div>
      </div>
    </PageContainer>
  );
}

import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { ContentWrapper } from "@/components/layout/content-wrapper";
import { PageHeader } from "@/components/layout/page-header";
import {
  getLeaderboard,
  normalizePeriod,
} from "@/services/leaderboard.service";
import { LeaderboardSummary } from "@/features/leaderboard/components/leaderboard-summary";
import { LeaderboardTabs } from "@/features/leaderboard/components/leaderboard-tabs";
import { LeaderboardTable } from "@/features/leaderboard/components/leaderboard-table";
import { LeaderboardPagination } from "@/features/leaderboard/components/leaderboard-pagination";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; page?: string }>;
}) {
  const params = await searchParams;
  const period = normalizePeriod(params.period);
  const page = Number(params.page ?? "1") || 1;
  const data = await getLeaderboard(period, page);

  if (!data) {
    return (
      <PageContainer>
        <ContentWrapper>
          <PageHeader title="Leaderboard" />
          <p className="text-muted-foreground text-sm">
            Please sign out and sign in again.
          </p>
        </ContentWrapper>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentWrapper>
        <PageHeader
          title="Leaderboard"
          description="See how you rank against your team by points and consistency."
        />

        <LeaderboardSummary summary={data.summary} />
        <LeaderboardTabs period={period} />

        {data.total === 0 ? (
          <div className="border-border bg-card/50 flex min-h-[240px] flex-col items-center justify-center gap-1 rounded-2xl border border-dashed text-center">
            <p className="text-sm font-medium">No rankings yet</p>
            <p className="text-muted-foreground max-w-xs text-xs">
              Complete your working hours to start earning points and climbing
              the board.
            </p>
          </div>
        ) : (
          <div className="border-border bg-card overflow-hidden rounded-2xl border">
            <LeaderboardTable rows={data.rows} />
            {data.totalPages > 1 && (
              <div className="border-border border-t p-4">
                <LeaderboardPagination
                  period={period}
                  page={data.page}
                  totalPages={data.totalPages}
                />
              </div>
            )}
          </div>
        )}
      </ContentWrapper>
    </PageContainer>
  );
}

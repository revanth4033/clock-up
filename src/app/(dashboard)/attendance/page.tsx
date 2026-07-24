import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { ContentWrapper } from "@/components/layout/content-wrapper";
import { PageHeader } from "@/components/layout/page-header";
import { getAttendanceHistory } from "@/services/attendance.service";
import { getSettlementHistory } from "@/services/presentation.service";
import { ENABLE_TIME_CREDITS } from "@/lib/flags";
import {
  AttendanceHistoryTable,
  type HistoryCredits,
} from "@/features/attendance/components/attendance-history-table";
import { HistoryPagination } from "@/features/attendance/components/history-pagination";

export const metadata: Metadata = { title: "Attendance" };

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const requested = Number(params.page ?? "1");
  const requestedPage = Number.isFinite(requested) ? requested : 1;
  const [result, settlement] = await Promise.all([
    getAttendanceHistory(requestedPage),
    ENABLE_TIME_CREDITS ? getSettlementHistory(requestedPage) : null,
  ]);

  if (!result.ok) {
    return (
      <PageContainer>
        <ContentWrapper>
          <PageHeader title="Attendance History" />
          <p className="text-muted-foreground text-sm">{result.message}</p>
        </ContentWrapper>
      </PageContainer>
    );
  }

  const { records, page, totalPages, total, officeName } = result.data;

  const credits: HistoryCredits | undefined = settlement
    ? Object.fromEntries(
        settlement.records.map((s) => [
          s.attendanceId,
          {
            redeemedCredits: s.redeemedCredits,
            countedMinutes: s.countedMinutes,
            earnedCredits: s.earnedCredits,
          },
        ]),
      )
    : undefined;

  return (
    <PageContainer>
      <ContentWrapper>
        <PageHeader
          title="Attendance History"
          description={
            total > 0
              ? `${total} record${total === 1 ? "" : "s"}`
              : "Your work sessions will appear here."
          }
        />

        {records.length === 0 ? (
          <div className="border-border bg-card/50 flex min-h-[240px] flex-col items-center justify-center gap-1 rounded-2xl border border-dashed text-center">
            <p className="text-sm font-medium">No attendance yet</p>
            <p className="text-muted-foreground text-xs">
              Clock in from the dashboard to start tracking.
            </p>
          </div>
        ) : (
          <div className="border-border bg-card overflow-hidden rounded-2xl border">
            <AttendanceHistoryTable
              records={records}
              officeName={officeName}
              credits={credits}
            />
            {totalPages > 1 && (
              <div className="border-border border-t p-4">
                <HistoryPagination page={page} totalPages={totalPages} />
              </div>
            )}
          </div>
        )}
      </ContentWrapper>
    </PageContainer>
  );
}

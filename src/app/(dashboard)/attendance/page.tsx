import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { ContentWrapper } from "@/components/layout/content-wrapper";
import { PageHeader } from "@/components/layout/page-header";
import { getAttendanceHistory } from "@/services/attendance.service";
import { AttendanceHistoryTable } from "@/features/attendance/components/attendance-history-table";
import { HistoryPagination } from "@/features/attendance/components/history-pagination";

export const metadata: Metadata = { title: "Attendance" };

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const requested = Number(params.page ?? "1");
  const result = await getAttendanceHistory(
    Number.isFinite(requested) ? requested : 1,
  );

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
            <AttendanceHistoryTable records={records} officeName={officeName} />
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

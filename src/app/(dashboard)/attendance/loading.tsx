import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function AttendanceLoading() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-56 rounded-lg" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </PageContainer>
  );
}

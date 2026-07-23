import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
        <Skeleton className="h-24 rounded-2xl md:col-span-2 xl:col-span-3" />
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl md:col-span-2" />
      </div>
    </PageContainer>
  );
}

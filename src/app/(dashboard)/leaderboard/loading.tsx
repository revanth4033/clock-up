import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48 rounded-lg" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </PageContainer>
  );
}

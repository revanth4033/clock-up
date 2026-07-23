import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-3">
        <Skeleton className="h-28 rounded-2xl xl:col-span-3" />
        <div className="flex flex-col gap-4 md:gap-5 xl:col-span-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <div className="flex flex-col gap-4 md:gap-5">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    </PageContainer>
  );
}

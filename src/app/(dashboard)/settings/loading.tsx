import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-2">
        <div className="flex flex-col gap-4 md:gap-5">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="flex flex-col gap-4 md:gap-5">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </PageContainer>
  );
}

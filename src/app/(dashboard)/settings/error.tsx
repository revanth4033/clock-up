"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";

export default function SettingsError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <PageContainer>
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
        <TriangleAlert className="text-destructive size-8" />
        <div className="space-y-1">
          <p className="text-lg font-semibold">Something went wrong</p>
          <p className="text-muted-foreground text-sm">
            We couldn&apos;t load your settings. Please try again.
          </p>
        </div>
        <Button onClick={reset} className="h-10">
          Retry
        </Button>
      </div>
    </PageContainer>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ContentWrapper } from "./content-wrapper";
import { PageContainer } from "./page-container";
import { PageHeader } from "./page-header";

type EmptyPageProps = {
  title: string;
  description?: string;
  /** Optional custom content for the placeholder area. */
  children?: ReactNode;
  className?: string;
};

/**
 * Placeholder page scaffold: a page header plus an empty, dashed content area.
 * Used by every route until its real feature is built.
 */
export function EmptyPage({
  title,
  description,
  children,
  className,
}: EmptyPageProps) {
  return (
    <PageContainer>
      <ContentWrapper>
        <PageHeader title={title} description={description} />
        <div
          className={cn(
            "border-border bg-card/50 flex min-h-[320px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-10 text-center",
            className,
          )}
        >
          {children ?? (
            <p className="text-muted-foreground text-sm">
              This section is coming soon.
            </p>
          )}
        </div>
      </ContentWrapper>
    </PageContainer>
  );
}

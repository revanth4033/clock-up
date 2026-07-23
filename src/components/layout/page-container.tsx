import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Responsive page container: centers content, caps width at 1440px, and applies
 * the DSD page padding (mobile 20 / tablet 24 / desktop 32).
 */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-6 md:px-8 md:py-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

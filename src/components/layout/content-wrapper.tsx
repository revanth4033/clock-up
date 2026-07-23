import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Vertical rhythm wrapper for the sections that make up a page. Keeps spacing
 * between a page header and its content consistent across screens.
 */
export function ContentWrapper({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-6", className)}>{children}</div>;
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A single metric: large value over a small label. */
export function Stat({
  value,
  label,
  className,
}: {
  value: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <p className="font-heading text-xl font-bold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A single metric: large value over a small label. `size="lg"` bumps the value
 * one step, for cards where the numbers are the whole point (e.g. Points). */
export function Stat({
  value,
  label,
  size = "default",
  className,
}: {
  value: ReactNode;
  label: string;
  size?: "default" | "lg";
  className?: string;
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <p
        className={cn(
          "font-heading font-bold tracking-tight tabular-nums",
          size === "lg" ? "text-2xl" : "text-xl",
        )}
      >
        {value}
      </p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

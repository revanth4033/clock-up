import { cn } from "@/lib/utils";

/** Linear progress bar (0–100). */
export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn(
        "bg-muted h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="bg-primary h-full rounded-full"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

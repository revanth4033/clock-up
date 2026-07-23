import Link from "next/link";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/** ClockUp wordmark + logo. Links home. Presentational (Server Component). */
export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard"
      aria-label="ClockUp home"
      className={cn(
        "focus-visible:ring-ring flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2",
        className,
      )}
    >
      <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl">
        <Clock className="size-5" />
      </span>
      <span className="font-heading text-lg font-bold tracking-tight">
        ClockUp
      </span>
    </Link>
  );
}

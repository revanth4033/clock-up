import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RedemptionStatus } from "@/types/domain";

const CONFIG: Record<
  RedemptionStatus | "none",
  { label: string; className: string }
> = {
  none: {
    label: "No reservation",
    className: "bg-muted text-muted-foreground",
  },
  pending: { label: "Pending", className: "bg-info/10 text-info" },
  applied: { label: "Applied", className: "bg-success/10 text-success" },
  released: { label: "Released", className: "bg-muted text-muted-foreground" },
  cancelled: {
    label: "Cancelled",
    className: "bg-warning/10 text-warning",
  },
};

/** Lifecycle badge for today's redemption hold. */
export function RedemptionStatusBadge({
  status,
  className,
}: {
  status: RedemptionStatus | "none";
  className?: string;
}) {
  const config = CONFIG[status];
  return (
    <Badge className={cn("border-transparent", config.className, className)}>
      {config.label}
    </Badge>
  );
}

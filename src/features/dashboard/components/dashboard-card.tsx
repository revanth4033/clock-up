import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardCardProps = {
  title?: string;
  icon?: LucideIcon;
  /** Trailing header content, e.g. a "View all" link. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/** Consistent card shell for dashboard sections (title + icon + content). */
export function DashboardCard({
  title,
  icon: Icon,
  action,
  children,
  className,
  contentClassName,
}: DashboardCardProps) {
  return (
    <Card className={cn("gap-0 rounded-2xl", className)}>
      {(title || action) && (
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="text-muted-foreground size-4" />}
            {title && (
              <h2 className="text-muted-foreground text-sm font-medium">
                {title}
              </h2>
            )}
          </div>
          {action}
        </CardHeader>
      )}
      <CardContent className={cn(contentClassName)}>{children}</CardContent>
    </Card>
  );
}

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  /** Rendered below the card body, e.g. a link to the other auth screen. */
  footer?: ReactNode;
};

/** Consistent card shell for every authentication screen. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="space-y-1.5 text-center">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        {footer && (
          <p className="text-muted-foreground text-center text-sm">{footer}</p>
        )}
      </CardContent>
    </Card>
  );
}

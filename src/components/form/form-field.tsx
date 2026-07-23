import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

/** Label + control + hint/error, wired for accessibility. Reused by every form. */
export function FormField({
  id,
  label,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div
      className={cn("space-y-1.5", className)}
      aria-describedby={describedBy}
    >
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

import { CircleAlert, CircleCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type FormAlertProps = {
  message: string;
  variant?: "error" | "success";
  className?: string;
};

/** Inline form-level feedback (server errors / success notices). */
export function FormAlert({
  message,
  variant = "error",
  className,
}: FormAlertProps) {
  const isSuccess = variant === "success";
  const Icon = isSuccess ? CircleCheck : CircleAlert;

  return (
    <Alert
      variant={isSuccess ? "default" : "destructive"}
      role={isSuccess ? "status" : "alert"}
      className={cn(isSuccess && "border-success/40 text-success", className)}
    >
      <Icon className="size-4" />
      <AlertDescription className={cn(isSuccess && "text-success/90")}>
        {message}
      </AlertDescription>
    </Alert>
  );
}

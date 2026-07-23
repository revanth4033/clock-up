import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type SubmitButtonProps = React.ComponentProps<typeof Button> & {
  loading?: boolean;
};

/** Submit button with a loading spinner + disabled state. */
export function SubmitButton({
  loading,
  disabled,
  children,
  ...props
}: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={loading || disabled} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}

"use client";

import { Loader2, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClockAction } from "@/features/attendance/hooks/use-clock-action";

/** The single primary action for the hero. Solid variant in every case so the
 * primary action stays visually dominant (per the approved hierarchy). Reuses
 * the shared clock-action logic — no attendance logic lives here. */
export function ClockButton({ action }: { action: "in" | "out" }) {
  const { busy, run } = useClockAction();
  const isOut = action === "out";

  return (
    <Button
      onClick={() => run(action)}
      disabled={busy}
      className="h-11 w-full justify-center gap-2 sm:w-56"
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isOut ? (
        <LogOut className="size-4" />
      ) : (
        <LogIn className="size-4" />
      )}
      {busy
        ? isOut
          ? "Clocking out…"
          : "Clocking in…"
        : isOut
          ? "Clock Out"
          : "Clock In"}
    </Button>
  );
}

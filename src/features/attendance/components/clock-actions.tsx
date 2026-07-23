"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleCheck, Loader2, LogIn, LogOut, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { attendanceApi } from "../api";
import { getCurrentPosition, geoErrorMessage } from "../lib/geolocation";
import { formatMinutes } from "@/utils/format";
import type { TodayState } from "@/services/dashboard.service";

export function ClockActions({ state }: { state: TodayState }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(action: "in" | "out") {
    setBusy(true);
    try {
      const coords = await getCurrentPosition();
      const res =
        action === "in"
          ? await attendanceApi.clockIn(coords)
          : await attendanceApi.clockOut(coords);

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      if (action === "in") {
        toast.success("Clocked in 🎉");
      } else if (res.data) {
        const { workedMinutes, pointsEarned } = res.data;
        toast.success(
          `Clocked out — ${formatMinutes(workedMinutes)} worked` +
            (pointsEarned ? `, +${pointsEarned} points 🎉` : ""),
        );
      } else {
        toast.success("Clocked out");
      }
      router.refresh();
    } catch (e) {
      toast.error(geoErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (state === "completed") {
    return (
      <div className="flex flex-col items-center gap-1.5 py-2 text-center">
        <CircleCheck className="text-success size-7" />
        <p className="text-sm font-medium">You&apos;re done for today 🎉</p>
        <p className="text-muted-foreground text-xs">See you tomorrow.</p>
      </div>
    );
  }

  const isClockOut = state === "working";

  return (
    <div className="space-y-2">
      <Button
        onClick={() => run(isClockOut ? "out" : "in")}
        disabled={busy}
        variant={isClockOut ? "outline" : "default"}
        className="h-11 w-full justify-center gap-2"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isClockOut ? (
          <LogOut className="size-4" />
        ) : (
          <LogIn className="size-4" />
        )}
        {busy
          ? isClockOut
            ? "Clocking out…"
            : "Clocking in…"
          : isClockOut
            ? "Clock Out"
            : "Clock In"}
      </Button>
      <p className="text-muted-foreground flex items-center justify-center gap-1 text-center text-xs">
        <MapPin className="size-3" />
        Requires your office location
      </p>
    </div>
  );
}

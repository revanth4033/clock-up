"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { attendanceApi } from "../api";
import { getCurrentPosition, geoErrorMessage } from "../lib/geolocation";
import { formatMinutes } from "@/utils/format";

/**
 * Clock In / Clock Out action logic — geolocation → attendance API → toast →
 * refresh. Extracted from the old ClockActions component so the primary-action
 * button (and any future caller) shares one implementation; the business logic
 * is unchanged. Returns a `busy` flag and a `run(action)` handler.
 */
export function useClockAction() {
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

  return { busy, run };
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { attendanceApi } from "../api";
import { formatShortDate, formatTimeOfDay } from "@/utils/format";
import type { PendingRecovery } from "@/types/domain";

/** Missed clock-out recovery (BRD §12). Opens on load when a prior day is
 * still open; the user submits the time they left. */
export function MissedClockOutDialog({
  recovery,
}: {
  recovery: PendingRecovery;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [time, setTime] = useState("18:00");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const clockOutIso = new Date(
      `${recovery.workDate}T${time}:00`,
    ).toISOString();
    const res = await attendanceApi.recover(recovery.id, clockOutIso);
    if (!res.success) {
      toast.error(res.message);
      setBusy(false);
      return;
    }
    toast.success("Attendance updated");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => setOpen(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>You forgot to clock out</DialogTitle>
          <DialogDescription>
            On {formatShortDate(recovery.workDate)} you clocked in at{" "}
            {formatTimeOfDay(recovery.clockIn)} but never clocked out. Enter the
            time you left to finish that day.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="recovery-time">Clock-out time</Label>
          <Input
            id="recovery-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-10"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={busy}
          >
            Later
          </Button>
          <Button onClick={submit} disabled={busy} className="gap-2">
            {busy && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

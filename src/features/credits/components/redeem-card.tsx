"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HandCoins, Loader2 } from "lucide-react";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { Stat } from "@/features/dashboard/components/stat";
import { ProgressBar } from "@/features/dashboard/components/progress-bar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMinutes, toPercent } from "@/utils/format";
import { isRestDay } from "@/features/dashboard/lib/rest-day";
import { RedemptionStatusBadge } from "./redemption-status-badge";
import { RedeemDialog } from "./redeem-dialog";
import { deriveRedeemView } from "../lib/redemption-view";
import { redemptionApi } from "../api";
import type {
  CreditSummary,
  DayType,
  TodayRedemption,
  TodaySummary,
} from "@/types/domain";

const DOT: Record<"go" | "progress" | "neutral", string> = {
  go: "bg-success",
  progress: "bg-info",
  neutral: "bg-muted-foreground",
};

/** The card's one-line answer to "Can I redeem right now?" */
function StatusLine({
  tone,
  label,
}: {
  tone: keyof typeof DOT;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-2 rounded-full", DOT[tone])} aria-hidden />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

function Metrics({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {items.map((m) => (
        <Stat key={m.label} value={m.value} label={m.label} />
      ))}
    </div>
  );
}

const mins = (n: number) => `${n} mins`;

/**
 * State-driven Redeem Credits card. It always answers "Can I redeem right now?"
 * via a status line, the relevant figures, a short next-step, and — only when
 * eligible — the primary CTA. No dead-end states. Day-type aware (rest day),
 * consistent with the rest of the Today's Work section. All write paths reuse
 * the existing dialog / API; no business rules live here.
 */
export function RedeemCard({
  today,
  credit,
  redemption,
  dayType,
  className,
}: {
  today: TodaySummary;
  credit: CreditSummary;
  redemption: TodayRedemption;
  dayType: DayType;
  className?: string;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "update">("create");
  const [cancelling, setCancelling] = useState(false);

  function openDialog(mode: "create" | "update") {
    setDialogMode(mode);
    setDialogOpen(true);
  }

  async function onCancel() {
    setCancelling(true);
    try {
      const res = await redemptionApi.cancel();
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      // Success → toast + re-derive the live state (no dedicated cancelled card).
      toast.success("Reservation cancelled");
      router.refresh();
    } finally {
      setCancelling(false);
    }
  }

  // Header badge only for an active/settled hold; hidden otherwise.
  const headerBadge =
    redemption.status === "pending" || redemption.status === "applied" ? (
      <RedemptionStatusBadge status={redemption.status} />
    ) : undefined;

  const body = (() => {
    // Rest day (weekend/holiday, no activity) — matches the section's day-type states.
    if (isRestDay(dayType, today.status !== "not_started")) {
      return (
        <>
          <StatusLine tone="neutral" label="No goal today" />
          <Metrics
            items={[{ value: mins(credit.currentBalance), label: "Balance" }]}
          />
          <p className="text-muted-foreground text-xs">
            Credits saved for your next work day.
          </p>
        </>
      );
    }

    const view = deriveRedeemView(today, credit, redemption);

    switch (view.mode) {
      case "redeemable":
        return (
          <>
            <StatusLine tone="go" label="Redeem available" />
            <Metrics
              items={[
                { value: mins(credit.available), label: "Available" },
                {
                  value: formatMinutes(redemption.remainingShortfall),
                  label: "Short",
                },
              ]}
            />
            <Button
              className="h-10 w-full"
              onClick={() => openDialog("create")}
            >
              Redeem {redemption.recommendedRedemption} mins
            </Button>
          </>
        );

      case "below_min_work": {
        const pct = toPercent(today.workedMinutes, redemption.minWorkMinutes);
        const remaining = Math.max(
          0,
          redemption.minWorkMinutes - today.workedMinutes,
        );
        return (
          <>
            <StatusLine tone="neutral" label="Unlocks after 4h" />
            <div className="space-y-1.5 pt-1">
              <ProgressBar value={pct} className="w-4/5" />
              <p className="text-muted-foreground text-xs tabular-nums">
                {formatMinutes(remaining)} left
              </p>
            </div>
            <Metrics
              items={[{ value: mins(credit.available), label: "Available" }]}
            />
          </>
        );
      }

      case "goal_met":
        return (
          <>
            <StatusLine tone="go" label="Goal met" />
            <Metrics
              items={[{ value: mins(credit.currentBalance), label: "Saved" }]}
            />
            <p className="text-muted-foreground text-xs">Saved for later.</p>
          </>
        );

      case "no_credits":
        return (
          <>
            <StatusLine tone="neutral" label="No credits" />
            <Metrics items={[{ value: mins(0), label: "Balance" }]} />
            <p className="text-muted-foreground text-xs">Earn 1/min past 9h.</p>
          </>
        );

      case "pending":
        return (
          <>
            <StatusLine tone="progress" label="Reserved" />
            <Metrics
              items={[
                { value: mins(redemption.requestedCredits), label: "Reserved" },
                {
                  value: formatMinutes(today.countedMinutes),
                  label: "Counted",
                },
              ]}
            />
            <p className="text-muted-foreground text-xs">
              Applied at clock-out.
            </p>
            <div className="flex gap-2">
              {view.canUpdate && (
                <Button
                  variant="outline"
                  className="h-9 flex-1"
                  onClick={() => openDialog("update")}
                >
                  Update
                </Button>
              )}
              <Button
                variant="ghost"
                className="text-destructive h-9 flex-1"
                disabled={cancelling}
                onClick={onCancel}
              >
                {cancelling && <Loader2 className="size-4 animate-spin" />}
                Cancel
              </Button>
            </div>
          </>
        );

      case "applied":
        return (
          <>
            <StatusLine tone="go" label="Applied" />
            <Metrics
              items={[
                {
                  value: mins(
                    redemption.appliedCredits ?? redemption.requestedCredits,
                  ),
                  label: "Applied",
                },
                {
                  value: formatMinutes(today.countedMinutes),
                  label: "Counted",
                },
                { value: mins(credit.currentBalance), label: "Balance" },
              ]}
            />
            <p className="text-muted-foreground text-xs">Goal reached.</p>
          </>
        );

      case "no_available":
        return (
          <>
            <StatusLine tone="neutral" label="Fully reserved" />
            <Metrics
              items={[
                { value: mins(credit.available), label: "Available" },
                { value: mins(credit.reserved), label: "Reserved" },
              ]}
            />
            <p className="text-muted-foreground text-xs">
              Frees up at settlement.
            </p>
          </>
        );

      case "day_closed":
      default: {
        const notStarted = today.status === "not_started";
        return (
          <>
            <StatusLine
              tone="neutral"
              label={notStarted ? "Clock in to redeem" : "Day closed"}
            />
            <Metrics
              items={[{ value: mins(credit.currentBalance), label: "Balance" }]}
            />
            <p className="text-muted-foreground text-xs">
              {notStarted ? "Redeem before clock-out." : "Saved for next time."}
            </p>
          </>
        );
      }
    }
  })();

  return (
    <DashboardCard
      title="Redeem Credits"
      icon={HandCoins}
      className={className}
      contentClassName="space-y-3"
      action={headerBadge}
    >
      {body}
      <RedeemDialog
        today={today}
        credit={credit}
        redemption={redemption}
        mode={dialogMode}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </DashboardCard>
  );
}

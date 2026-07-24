"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HandCoins, Loader2 } from "lucide-react";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { Stat } from "@/features/dashboard/components/stat";
import { Button } from "@/components/ui/button";
import { formatMinutes } from "@/utils/format";
import { RedemptionStatusBadge } from "./redemption-status-badge";
import { RedeemDialog } from "./redeem-dialog";
import { deriveRedeemView } from "../lib/redemption-view";
import { redemptionApi } from "../api";
import type {
  CreditSummary,
  TodayRedemption,
  TodaySummary,
} from "@/types/domain";

/**
 * The dedicated Redeem Credits card. All figures come from the Phase 4E read
 * models; the Redeem/Update/Cancel actions call the two write routes. No
 * business rules are evaluated here — the RPC stays authoritative.
 */
export function RedeemCard({
  today,
  credit,
  redemption,
  className,
}: {
  today: TodaySummary;
  credit: CreditSummary;
  redemption: TodayRedemption;
  className?: string;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "update">("create");
  const [cancelling, setCancelling] = useState(false);

  const view = deriveRedeemView(today, credit, redemption);

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
      toast.success("Redemption cancelled");
      router.refresh();
    } finally {
      setCancelling(false);
    }
  }

  return (
    <DashboardCard
      title="Redeem Credits"
      icon={HandCoins}
      className={className}
      contentClassName="space-y-4"
      action={<RedemptionStatusBadge status={redemption.status} />}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={credit.available} label="Available" />
        <Stat value={redemption.requestedCredits} label="Requested" />
        <Stat
          value={formatMinutes(redemption.remainingShortfall)}
          label="Shortfall"
        />
        <Stat value={redemption.recommendedRedemption} label="Recommended" />
      </div>

      <p className="text-muted-foreground text-sm">{view.message}</p>

      {(view.canRedeem || view.canUpdate || view.canCancel) && (
        <div className="flex flex-wrap gap-2">
          {view.canRedeem && (
            <Button onClick={() => openDialog("create")}>Redeem credits</Button>
          )}
          {view.canUpdate && (
            <Button variant="outline" onClick={() => openDialog("update")}>
              Update
            </Button>
          )}
          {view.canCancel && (
            <Button
              variant="ghost"
              className="text-destructive"
              disabled={cancelling}
              onClick={onCancel}
            >
              {cancelling && <Loader2 className="size-4 animate-spin" />}
              Cancel
            </Button>
          )}
        </div>
      )}

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

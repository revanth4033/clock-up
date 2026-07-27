import { Wallet } from "lucide-react";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { Stat } from "@/features/dashboard/components/stat";
import type { CreditSummary } from "@/types/domain";

/** All-time credit position: balance, reserved (pending holds) and available. */
export function CreditBalanceCard({
  credit,
  className,
}: {
  credit: CreditSummary;
  className?: string;
}) {
  return (
    <DashboardCard
      title="Credit Balance"
      icon={Wallet}
      className={className}
      contentClassName="space-y-4"
    >
      <div className="grid grid-cols-3 gap-3">
        <Stat value={credit.currentBalance} label="Balance" />
        <Stat value={credit.reserved} label="Reserved" />
        {/* Available = Balance − Reserved; the divider marks it as the result,
            matching the Counted breakdown in Today's Time Credits. */}
        <Stat
          value={credit.available}
          label="Available"
          className="border-l pl-3"
        />
      </div>
      <div className="text-muted-foreground flex justify-between gap-2 text-xs tabular-nums">
        <span>Total earned: {credit.totalEarned}</span>
        <span>Total used: {credit.totalUsed}</span>
      </div>
    </DashboardCard>
  );
}

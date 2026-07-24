import { TodayCreditsCard } from "./today-credits-card";
import { CreditBalanceCard } from "./credit-balance-card";
import { RedeemCard } from "./redeem-card";
import type {
  CreditSummary,
  TodayRedemption,
  TodaySummary,
} from "@/types/domain";

/**
 * The dashboard Time Credit experience: today's breakdown, the running balance,
 * and (when redemption is enabled) the Redeem Credits card. Rendered only when
 * ENABLE_TIME_CREDITS is on; the redeem card is further gated by
 * ENABLE_CREDIT_REDEMPTION via `redemptionEnabled`.
 */
export function TimeCreditsSection({
  today,
  credit,
  redemption,
  redemptionEnabled,
  className,
}: {
  today: TodaySummary;
  credit: CreditSummary;
  redemption: TodayRedemption;
  redemptionEnabled: boolean;
  className?: string;
}) {
  return (
    <section aria-label="Time Credits" className={className}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
        <TodayCreditsCard
          today={today}
          className="md:col-span-2 xl:col-span-1"
        />
        <CreditBalanceCard credit={credit} />
        {redemptionEnabled && (
          <RedeemCard
            today={today}
            credit={credit}
            redemption={redemption}
            className="md:col-span-2 xl:col-span-1"
          />
        )}
      </div>
    </section>
  );
}

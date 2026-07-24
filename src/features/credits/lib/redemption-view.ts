import type {
  CreditSummary,
  TodayRedemption,
  TodaySummary,
} from "@/types/domain";

/**
 * Presentation state for the Redeem Credits card. This is pure UI derivation —
 * it only branches on the read-model fields the backend already computed
 * (status, shortfall, recommended, available). No business rules are evaluated
 * here; the RPC remains the sole authority on whether a redemption is allowed.
 */
export type RedeemMode =
  | "applied" // hold settled into today's counted time
  | "pending" // active hold awaiting settlement
  | "redeemable" // no hold, and the backend recommends an amount > 0
  | "no_credits" // nothing earned to spend
  | "day_closed" // not clocked in for an open day
  | "goal_met" // no remaining shortfall
  | "no_available" // credits exist but none are available
  | "below_min_work"; // working, but the recommended amount is 0

export type RedeemView = {
  mode: RedeemMode;
  message: string;
  canRedeem: boolean;
  canUpdate: boolean;
  canCancel: boolean;
};

export function deriveRedeemView(
  today: TodaySummary,
  credit: CreditSummary,
  redemption: TodayRedemption,
): RedeemView {
  const { status, requestedCredits, appliedCredits, remainingShortfall } =
    redemption;
  const recommended = redemption.recommendedRedemption;

  if (status === "applied") {
    return {
      mode: "applied",
      message: `${appliedCredits ?? requestedCredits} credits applied to today — counted ${today.countedMinutes} min.`,
      canRedeem: false,
      canUpdate: false,
      canCancel: false,
    };
  }

  if (status === "pending") {
    return {
      mode: "pending",
      message: `You've reserved ${requestedCredits} credits for today.`,
      canRedeem: false,
      canUpdate: recommended > 0,
      canCancel: true,
    };
  }

  // No active hold (status is "none", "cancelled" or "released"): decide whether
  // a fresh redemption is possible, else explain why not.
  if (credit.currentBalance === 0) {
    return {
      mode: "no_credits",
      message:
        "You don't have any credits yet. Earn credits by working past your daily goal.",
      ...noActions(),
    };
  }
  if (today.status !== "working") {
    return {
      mode: "day_closed",
      message: "Redemption is available while you're clocked in for the day.",
      ...noActions(),
    };
  }
  if (remainingShortfall === 0) {
    return {
      mode: "goal_met",
      message: "You've met today's goal — no redemption needed.",
      ...noActions(),
    };
  }
  if (credit.available === 0) {
    return {
      mode: "no_available",
      message: "All your credits are currently reserved.",
      ...noActions(),
    };
  }
  if (recommended === 0) {
    return {
      mode: "below_min_work",
      message:
        "Keep working — you can redeem once you've met the minimum work time.",
      ...noActions(),
    };
  }

  return {
    mode: "redeemable",
    message: `You can redeem up to ${recommended} credits to reach today's goal.`,
    canRedeem: true,
    canUpdate: false,
    canCancel: false,
  };
}

function noActions() {
  return { canRedeem: false, canUpdate: false, canCancel: false };
}

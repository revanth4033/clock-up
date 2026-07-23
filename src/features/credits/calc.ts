import { DAILY_GOAL_MINUTES } from "@/constants/attendance";
import type { TimeCreditSummary } from "@/types/domain";

/**
 * Time Credits — Phase 1 (architecture preparation ONLY). See docs/adr/ADR-008.
 *
 * Pure, side-effect-free helpers that encode the *future* Time Credit earning
 * rule, so Phase 2 has a single, tested source of truth to mirror in the
 * database RPC. IMPORTANT: nothing in the running application imports or calls
 * these yet. Points are still awarded exactly as today (see the clock_out RPC
 * and points_ledger). No credit is earned, stored, or consumed in Phase 1 —
 * this file changes no behavior.
 */

/** Phase 2 rule: one Time Credit per minute worked beyond the daily goal. */
export const TIME_CREDIT_PER_EXTRA_MINUTE = 1;

/**
 * Credits a completed day WOULD earn under the Phase 2 model: one credit per
 * minute past the 9h goal (540 min), never negative.
 *   540 → 0,  545 → 5,  567 → 27,  614 → 74
 */
export function creditsForWorkedMinutes(workedMinutes: number): number {
  const extra = Math.max(0, Math.floor(workedMinutes) - DAILY_GOAL_MINUTES);
  return extra * TIME_CREDIT_PER_EXTRA_MINUTE;
}

/** Net balance = earned − used. `used` stays 0 until redemption (Phase 3+). */
export function creditBalance(earned: number, used: number): number {
  return earned - used;
}

/** Assemble a credit summary from its parts (balance is always derived). */
export function toCreditSummary(
  earned: number,
  used: number,
): TimeCreditSummary {
  return { earned, used, balance: creditBalance(earned, used) };
}

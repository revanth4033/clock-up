import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth.service";
import { settlementReadRepository } from "@/repositories/settlement-read.repository";
import { redemptionRepository } from "@/repositories/redemption.repository";
import { DAILY_GOAL_MINUTES, HISTORY_PAGE_SIZE } from "@/constants/attendance";
import type {
  AttendanceSettlement,
  CreditSummary,
  TodayRedemption,
  TodaySummary,
} from "@/types/domain";

/**
 * Presentation / read models for the future dashboard & redemption UI (Phase 4E).
 * READ ONLY: it aggregates existing settlement data (points, credits, holds) into
 * simple view models. No business logic, no writes, no settlement — Goal Progress
 * and Counted Time come straight from settled data; Recommended Redemption is the
 * documented `min(shortfall, available)` display hint.
 */

/** UTC work-date, matching the attendance engine's `current_date`. */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Point-in-time worked minutes for an in-progress day. */
function liveWorked(clockIn: string): number {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(clockIn).getTime()) / 60000),
  );
}

/** Worked-so-far for a settlement row: settled value if completed, else live. */
function workedSoFar(s: AttendanceSettlement): number {
  if (s.status === "completed") return s.workedMinutes ?? 0;
  return s.clockIn ? liveWorked(s.clockIn) : 0;
}

/** Today's dashboard tile. Goal progress uses Counted Time. */
export async function getTodaySummary(): Promise<TodaySummary | null> {
  const user = await getCurrentUser();
  if (!user?.profile) return null;
  const supabase = await createClient();
  const s = await settlementReadRepository.getForDate(
    supabase,
    user.profile.id,
    todayStr(),
  );

  if (!s) {
    return {
      status: "not_started",
      clockIn: null,
      workedMinutes: 0,
      redeemedCredits: 0,
      countedMinutes: 0,
      points: 0,
      earnedCredits: 0,
      goalMinutes: DAILY_GOAL_MINUTES,
      goalProgress: 0,
    };
  }

  const worked = workedSoFar(s);
  const counted = worked + s.redeemedCredits;
  return {
    status: s.status,
    clockIn: s.clockIn,
    workedMinutes: worked,
    redeemedCredits: s.redeemedCredits,
    countedMinutes: counted,
    points: s.points,
    earnedCredits: s.earnedCredits,
    goalMinutes: DAILY_GOAL_MINUTES,
    goalProgress: Math.min(1, counted / DAILY_GOAL_MINUTES),
  };
}

/** All-time credit totals + today's redemption status. */
export async function getCreditSummary(): Promise<CreditSummary | null> {
  const user = await getCurrentUser();
  if (!user?.profile) return null;
  const supabase = await createClient();
  const [bal, hold] = await Promise.all([
    settlementReadRepository.getBalance(supabase, user.profile.id),
    redemptionRepository.getToday(supabase),
  ]);
  return {
    totalEarned: bal.earned,
    totalUsed: bal.used,
    currentBalance: bal.balance,
    reserved: bal.reserved,
    available: bal.available,
    todayRedemptionStatus: hold ? hold.status : "none",
  };
}

/** Today's redemption view model (incl. the dialog's recommended amount). */
export async function getTodayRedemption(): Promise<TodayRedemption | null> {
  const user = await getCurrentUser();
  if (!user?.profile) return null;
  const supabase = await createClient();
  const [s, bal, hold, minWork] = await Promise.all([
    settlementReadRepository.getForDate(supabase, user.profile.id, todayStr()),
    settlementReadRepository.getBalance(supabase, user.profile.id),
    redemptionRepository.getToday(supabase),
    redemptionRepository.getMinWorkMinutes(supabase),
  ]);

  const worked = s ? workedSoFar(s) : 0;
  const counted = worked + (s?.redeemedCredits ?? 0);
  const shortfall = Math.max(0, DAILY_GOAL_MINUTES - counted);
  // Redeemable only while the day is open and the minimum work is met.
  const redeemable =
    s?.status === "working" && worked >= minWork && shortfall > 0;
  // Today's own hold is adjustable, so it counts as available for this dialog —
  // matches the create-hold RPC's cap (balance − OTHER pending holds).
  const availableForHold = bal.available + (hold?.requestedCredits ?? 0);
  const recommended = redeemable ? Math.min(shortfall, availableForHold) : 0;

  return {
    requestedCredits: hold?.requestedCredits ?? 0,
    appliedCredits: hold?.appliedCredits ?? null,
    status: hold ? hold.status : "none",
    remainingShortfall: shortfall,
    recommendedRedemption: Math.max(0, recommended),
    minWorkMinutes: minWork,
  };
}

/** A page of the caller's settlement history (extends the history read model). */
export async function getSettlementHistory(page: number = 1): Promise<{
  records: AttendanceSettlement[];
  page: number;
  totalPages: number;
  total: number;
} | null> {
  const user = await getCurrentUser();
  if (!user?.profile) return null;
  const supabase = await createClient();
  const safePage = Math.max(1, Math.floor(page) || 1);
  const offset = (safePage - 1) * HISTORY_PAGE_SIZE;
  const { records, total } = await settlementReadRepository.getHistory(
    supabase,
    user.profile.id,
    offset,
    HISTORY_PAGE_SIZE,
  );
  return {
    records,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE)),
    total,
  };
}

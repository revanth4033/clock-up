import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth.service";
import { redemptionRepository } from "@/repositories/redemption.repository";
import { ENABLE_CREDIT_REDEMPTION } from "@/lib/flags";
import type { ServiceResult } from "./types";
import type { CreditAvailability, RedemptionHold } from "@/types/domain";

const HISTORY_LIMIT = 50;

/**
 * Redemption domain service (Phase 4B — infrastructure only). Owns the hold
 * business rules; contains NO attendance, settlement, ledger, or points logic.
 * Every method is gated by ENABLE_CREDIT_REDEMPTION: when the flag is off the
 * subsystem is dormant and the app behaves exactly as today. Nothing in the
 * running application calls this service yet.
 */

const ERROR_MESSAGES: Record<string, string> = {
  FEATURE_DISABLED: "Credit redemption isn't available yet.",
  AUTH_REQUIRED: "Please sign in again.",
  INVALID_CREDITS: "Enter a valid, positive credit amount.",
  NO_ATTENDANCE: "Clock in before redeeming credits.",
  DAY_NOT_OPEN: "You can only redeem credits during an open work day.",
  MIN_WORK_NOT_MET: "Work the minimum required hours before redeeming credits.",
  NO_SHORTFALL: "You've already met today's goal — no redemption needed.",
  REQUEST_EXCEEDS_SHORTFALL: "That's more than today's remaining shortfall.",
  INSUFFICIENT_CREDITS: "You don't have enough available credits.",
  NO_ACTIVE_REDEMPTION: "There's no active redemption to cancel.",
  SERVER_ERROR: "Something went wrong. Please try again.",
};
const KNOWN_CODES = Object.keys(ERROR_MESSAGES).filter(
  (c) => c !== "SERVER_ERROR",
);

function mapError(error: unknown): { code: string; message: string } {
  const raw = (error as { message?: string })?.message ?? "";
  const code = KNOWN_CODES.find((c) => raw.includes(c)) ?? "SERVER_ERROR";
  if (code === "SERVER_ERROR") console.error("[redemption] RPC error:", raw);
  return { code, message: ERROR_MESSAGES[code] };
}

const disabled = (): { code: string; message: string } => ({
  code: "FEATURE_DISABLED",
  message: ERROR_MESSAGES.FEATURE_DISABLED,
});

/** The signed-in user's redemption-aware balance, or null. */
export async function getAvailability(): Promise<CreditAvailability | null> {
  if (!ENABLE_CREDIT_REDEMPTION) return null;
  const user = await getCurrentUser();
  if (!user?.profile) return null;
  const supabase = await createClient();
  return redemptionRepository.getAvailability(supabase, user.profile.id);
}

/** Today's hold for the signed-in user, or null. */
export async function getTodayRedemption(): Promise<RedemptionHold | null> {
  if (!ENABLE_CREDIT_REDEMPTION) return null;
  const user = await getCurrentUser();
  if (!user?.profile) return null;
  const supabase = await createClient();
  return redemptionRepository.getToday(supabase);
}

/** The signed-in user's redemption history (newest first), or null. */
export async function getHistory(
  limit: number = HISTORY_LIMIT,
): Promise<RedemptionHold[] | null> {
  if (!ENABLE_CREDIT_REDEMPTION) return null;
  const user = await getCurrentUser();
  if (!user?.profile) return null;
  const supabase = await createClient();
  return redemptionRepository.getHistory(supabase, user.profile.id, limit);
}

/** Create or adjust today's hold. Validation happens in the RPC. */
export async function createOrUpdateRedemption(
  requestedCredits: number,
): Promise<
  ServiceResult<{
    redemptionId: string;
    requestedCredits: number;
    availableBalance: number;
  }>
> {
  if (!ENABLE_CREDIT_REDEMPTION) return { ok: false, ...disabled() };
  const user = await getCurrentUser();
  if (!user?.profile) {
    return {
      ok: false,
      code: "AUTH_REQUIRED",
      message: ERROR_MESSAGES.AUTH_REQUIRED,
    };
  }
  const supabase = await createClient();
  try {
    const result = await redemptionRepository.createOrUpdate(
      supabase,
      requestedCredits,
    );
    return { ok: true, message: "Redemption reserved.", data: result };
  } catch (e) {
    const { code, message } = mapError(e);
    return { ok: false, code, message };
  }
}

/** Cancel today's pending hold. */
export async function cancelRedemption(): Promise<
  ServiceResult<{ availableBalance: number }>
> {
  if (!ENABLE_CREDIT_REDEMPTION) return { ok: false, ...disabled() };
  const user = await getCurrentUser();
  if (!user?.profile) {
    return {
      ok: false,
      code: "AUTH_REQUIRED",
      message: ERROR_MESSAGES.AUTH_REQUIRED,
    };
  }
  const supabase = await createClient();
  try {
    const result = await redemptionRepository.cancel(supabase);
    return { ok: true, message: "Redemption cancelled.", data: result };
  } catch (e) {
    const { code, message } = mapError(e);
    return { ok: false, code, message };
  }
}

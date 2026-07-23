import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth.service";
import {
  creditsRepository,
  type AddCreditsInput,
  type ConsumeCreditsInput,
} from "@/repositories/credits.repository";
import type { ServiceResult } from "./types";
import type { TimeCreditEntry, TimeCreditSummary } from "@/types/domain";

const HISTORY_LIMIT = 50;

/**
 * Time Credits domain service (Phase 2 infrastructure). Pure domain logic — no
 * attendance rules, no UI. NOTHING in the running application calls these yet;
 * automatic earning (clock-out) and consumption arrive in Phase 3.
 */

const ERROR_MESSAGES: Record<string, string> = {
  INSUFFICIENT_CREDITS: "You don't have enough Time Credits for that.",
  INVALID_CREDITS: "Enter a valid, positive credit amount.",
  INVALID_REASON: "A reason is required.",
  INVALID_ENTRY_TYPE: "That credit type can't be added this way.",
  AUTH_REQUIRED: "Please sign in again.",
  SERVER_ERROR: "Something went wrong. Please try again.",
};
const KNOWN_CODES = Object.keys(ERROR_MESSAGES).filter(
  (c) => c !== "SERVER_ERROR",
);

/** Maps a raised Postgres exception (its message) to a friendly code + message. */
function mapError(error: unknown): { code: string; message: string } {
  const raw = (error as { message?: string })?.message ?? "";
  const code = KNOWN_CODES.find((c) => raw.includes(c)) ?? "SERVER_ERROR";
  if (code === "SERVER_ERROR") console.error("[credits] RPC error:", raw);
  return { code, message: ERROR_MESSAGES[code] };
}

/** The signed-in user's derived credit balance, or null if unauthenticated. */
export async function getBalance(): Promise<TimeCreditSummary | null> {
  const user = await getCurrentUser();
  if (!user?.profile) return null;
  const supabase = await createClient();
  return creditsRepository.getBalance(supabase, user.profile.id);
}

/** The signed-in user's credit history (newest first), or null if unauthenticated. */
export async function getHistory(
  limit: number = HISTORY_LIMIT,
): Promise<TimeCreditEntry[] | null> {
  const user = await getCurrentUser();
  if (!user?.profile) return null;
  const supabase = await createClient();
  return creditsRepository.getHistory(supabase, user.profile.id, limit);
}

/** Grants credits to the signed-in user. Returns the new balance. */
export async function addCredits(
  input: AddCreditsInput,
): Promise<ServiceResult<{ balance: number }>> {
  const user = await getCurrentUser();
  if (!user?.profile) {
    return {
      ok: false,
      code: "AUTH_REQUIRED",
      message: "Please sign in again.",
    };
  }
  const supabase = await createClient();
  try {
    const balance = await creditsRepository.addCredits(supabase, input);
    return { ok: true, message: "Credits added.", data: { balance } };
  } catch (e) {
    const { code, message } = mapError(e);
    return { ok: false, code, message };
  }
}

/**
 * Consumes credits from the signed-in user's balance. The RPC guarantees the
 * balance can never go negative, so an over-spend returns INSUFFICIENT_CREDITS.
 */
export async function consumeCredits(
  input: ConsumeCreditsInput,
): Promise<ServiceResult<{ balance: number }>> {
  const user = await getCurrentUser();
  if (!user?.profile) {
    return {
      ok: false,
      code: "AUTH_REQUIRED",
      message: "Please sign in again.",
    };
  }
  const supabase = await createClient();
  try {
    const balance = await creditsRepository.consumeCredits(supabase, input);
    return { ok: true, message: "Credits redeemed.", data: { balance } };
  } catch (e) {
    const { code, message } = mapError(e);
    return { ok: false, code, message };
  }
}

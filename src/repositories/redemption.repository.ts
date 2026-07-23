import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreditAvailability,
  RedemptionHold,
  RedemptionStatus,
} from "@/types/domain";

type HoldRow = {
  id: string;
  attendance_id: string;
  requested_credits: number;
  applied_credits: number | null;
  status: RedemptionStatus;
  created_at: string;
};

type AvailabilityRow = {
  current_balance: number | null;
  reserved_credits: number | null;
  available_balance: number | null;
};

const HOLD_COLUMNS =
  "id, attendance_id, requested_credits, applied_credits, status, created_at";

const toHold = (r: HoldRow): RedemptionHold => ({
  id: r.id,
  attendanceId: r.attendance_id,
  requestedCredits: r.requested_credits,
  appliedCredits: r.applied_credits,
  status: r.status,
  createdAt: r.created_at,
});

/**
 * Data access for the redemption subsystem (Phase 4B — holds only). Reads go
 * through RLS-scoped queries / the balance view; the three mutations go through
 * the SECURITY DEFINER RPCs. No settlement, ledger, or points here. Mirrors the
 * credits/stats repositories.
 */
export const redemptionRepository = {
  /** The configurable minimum worked minutes before credits may be redeemed. */
  async getMinWorkMinutes(supabase: SupabaseClient): Promise<number> {
    const { data, error } = await supabase
      .from("credit_policy")
      .select("min_work_minutes")
      .maybeSingle();
    if (error) throw error;
    return Number(data?.min_work_minutes ?? 240);
  },

  /** The caller's redemption-aware balance (view; RLS-scoped). */
  async getAvailability(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<CreditAvailability> {
    const { data, error } = await supabase
      .from("v_time_credit_balance")
      .select("current_balance, reserved_credits, available_balance")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    const row = (data ?? {}) as AvailabilityRow;
    return {
      balance: Number(row.current_balance ?? 0),
      reserved: Number(row.reserved_credits ?? 0),
      available: Number(row.available_balance ?? 0),
    };
  },

  /** The caller's hold for today's attendance, if any. */
  async getToday(supabase: SupabaseClient): Promise<RedemptionHold | null> {
    const { data, error } = await supabase.rpc("get_today_redemption");
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as HoldRow | undefined;
    return row ? toHold(row) : null;
  },

  /** The caller's redemption history (newest first). */
  async getHistory(
    supabase: SupabaseClient,
    userId: string,
    limit: number,
  ): Promise<RedemptionHold[]> {
    const { data, error } = await supabase
      .from("time_credit_redemption")
      .select(HOLD_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as HoldRow[]).map(toHold);
  },

  /** Create or adjust today's pending hold (RPC). Returns the new available. */
  async createOrUpdate(
    supabase: SupabaseClient,
    requestedCredits: number,
  ): Promise<{
    redemptionId: string;
    requestedCredits: number;
    availableBalance: number;
  }> {
    const { data, error } = await supabase.rpc("create_or_update_redemption", {
      p_requested_credits: requestedCredits,
    });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as {
      redemption_id: string;
      requested_credits: number;
      available_balance: number;
    };
    return {
      redemptionId: row.redemption_id,
      requestedCredits: Number(row.requested_credits),
      availableBalance: Number(row.available_balance),
    };
  },

  /** Cancel today's pending hold (RPC). Returns the new available balance. */
  async cancel(
    supabase: SupabaseClient,
  ): Promise<{ availableBalance: number }> {
    const { data, error } = await supabase.rpc("cancel_redemption");
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as {
      available_balance: number;
    };
    return { availableBalance: Number(row.available_balance) };
  },
};

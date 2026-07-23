import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  TimeCreditEntry,
  TimeCreditEntryType,
  TimeCreditSummary,
} from "@/types/domain";

type BalanceRow = {
  earned_credits: number | null;
  used_credits: number | null;
  current_balance: number | null;
};

type LedgerRow = {
  id: string;
  attendance_id: string | null;
  entry_type: TimeCreditEntryType;
  credits: number;
  reason: string;
  created_at: string;
};

const LEDGER_COLUMNS =
  "id, attendance_id, entry_type, credits, reason, created_at";

const EMPTY_SUMMARY: TimeCreditSummary = { earned: 0, used: 0, balance: 0 };

const toEntry = (r: LedgerRow): TimeCreditEntry => ({
  id: r.id,
  attendanceId: r.attendance_id,
  entryType: r.entry_type,
  credits: r.credits,
  reason: r.reason,
  createdAt: r.created_at,
});

/** Positive credit grant (earned / bonus / manual_adjustment). */
export type AddCreditsInput = {
  credits: number;
  entryType: Extract<
    TimeCreditEntryType,
    "earned" | "bonus" | "manual_adjustment"
  >;
  reason: string;
  attendanceId?: string | null;
};

/** A consumption of the caller's balance (recorded as a negative "used" row). */
export type ConsumeCreditsInput = {
  credits: number; // positive amount to spend
  reason: string;
};

/**
 * Data access for the Time Credits subsystem. Reads go through the RLS-scoped
 * balance view / ledger table; writes go exclusively through the SECURITY
 * DEFINER RPCs (`add_time_credit` / `consume_time_credit`) — clients can never
 * write the ledger directly. Mirrors the points/stats repositories.
 */
export const creditsRepository = {
  /** The caller's derived balance (from `v_time_credit_balance`, RLS-scoped). */
  async getBalance(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<TimeCreditSummary> {
    const { data, error } = await supabase
      .from("v_time_credit_balance")
      .select("earned_credits, used_credits, current_balance")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return EMPTY_SUMMARY;
    const row = data as BalanceRow;
    return {
      earned: Number(row.earned_credits ?? 0),
      used: Number(row.used_credits ?? 0),
      balance: Number(row.current_balance ?? 0),
    };
  },

  /** The caller's ledger history, newest first. */
  async getHistory(
    supabase: SupabaseClient,
    userId: string,
    limit: number,
  ): Promise<TimeCreditEntry[]> {
    const { data, error } = await supabase
      .from("time_credit_ledger")
      .select(LEDGER_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as LedgerRow[]).map(toEntry);
  },

  /** Grants credits via the atomic RPC; returns the new balance. */
  async addCredits(
    supabase: SupabaseClient,
    input: AddCreditsInput,
  ): Promise<number> {
    const { data, error } = await supabase.rpc("add_time_credit", {
      p_credits: input.credits,
      p_entry_type: input.entryType,
      p_reason: input.reason,
      p_attendance_id: input.attendanceId ?? null,
    });
    if (error) throw error;
    return Number(data);
  },

  /** Consumes credits via the balance-checked, race-safe RPC; returns the new
   * balance. Throws `INSUFFICIENT_CREDITS` if the balance is too low. */
  async consumeCredits(
    supabase: SupabaseClient,
    input: ConsumeCreditsInput,
  ): Promise<number> {
    const { data, error } = await supabase.rpc("consume_time_credit", {
      p_credits: input.credits,
      p_reason: input.reason,
    });
    if (error) throw error;
    return Number(data);
  },
};

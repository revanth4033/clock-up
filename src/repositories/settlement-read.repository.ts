import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AttendanceSettlement,
  AttendanceStatus,
  CreditAvailability,
} from "@/types/domain";

type SettlementRow = {
  attendance_id: string;
  work_date: string;
  clock_in: string | null;
  clock_out: string | null;
  worked_minutes: number | null;
  status: AttendanceStatus;
  is_edited: boolean;
  points: number;
  redeemed_credits: number;
  earned_credits: number;
  counted_minutes: number;
};

type BalanceRow = {
  earned_credits: number | null;
  used_credits: number | null;
  current_balance: number | null;
  reserved_credits: number | null;
  available_balance: number | null;
};

const COLUMNS =
  "attendance_id, work_date, clock_in, clock_out, worked_minutes, status, is_edited, points, redeemed_credits, earned_credits, counted_minutes";

const toSettlement = (r: SettlementRow): AttendanceSettlement => ({
  attendanceId: r.attendance_id,
  workDate: r.work_date,
  clockIn: r.clock_in,
  clockOut: r.clock_out,
  workedMinutes: r.worked_minutes,
  status: r.status,
  isEdited: r.is_edited,
  points: Number(r.points ?? 0),
  redeemedCredits: Number(r.redeemed_credits ?? 0),
  earnedCredits: Number(r.earned_credits ?? 0),
  countedMinutes: Number(r.counted_minutes ?? 0),
});

/**
 * Read-only queries for the presentation layer (Phase 4E). Reads the
 * `v_attendance_settlement` and `v_time_credit_balance` views (RLS-scoped to the
 * caller). Deliberately separate from the write/settlement repositories (CQRS);
 * it never mutates anything.
 */
export const settlementReadRepository = {
  /** The caller's settlement projection for a given day (or null). */
  async getForDate(
    supabase: SupabaseClient,
    userId: string,
    workDate: string,
  ): Promise<AttendanceSettlement | null> {
    const { data, error } = await supabase
      .from("v_attendance_settlement")
      .select(COLUMNS)
      .eq("user_id", userId)
      .eq("work_date", workDate)
      .maybeSingle();
    if (error) throw error;
    return data ? toSettlement(data as SettlementRow) : null;
  },

  /** A page of the caller's settlement history (newest first) + total count. */
  async getHistory(
    supabase: SupabaseClient,
    userId: string,
    offset: number,
    limit: number,
  ): Promise<{ records: AttendanceSettlement[]; total: number }> {
    const { data, error, count } = await supabase
      .from("v_attendance_settlement")
      .select(COLUMNS, { count: "exact" })
      .eq("user_id", userId)
      .order("work_date", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return {
      records: (data as SettlementRow[]).map(toSettlement),
      total: count ?? 0,
    };
  },

  /** Full redemption-aware balance (all five columns, one query). */
  async getBalance(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<CreditAvailability & { earned: number; used: number }> {
    const { data, error } = await supabase
      .from("v_time_credit_balance")
      .select(
        "earned_credits, used_credits, current_balance, reserved_credits, available_balance",
      )
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    const row = (data ?? {}) as BalanceRow;
    return {
      earned: Number(row.earned_credits ?? 0),
      used: Number(row.used_credits ?? 0),
      balance: Number(row.current_balance ?? 0),
      reserved: Number(row.reserved_credits ?? 0),
      available: Number(row.available_balance ?? 0),
    };
  },
};

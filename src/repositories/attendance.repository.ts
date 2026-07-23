import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AttendanceRecord,
  AttendanceStatus,
  ClockOutResult,
  GeoCoords,
  HistoryRecord,
  PendingRecovery,
} from "@/types/domain";

type Row = {
  id: string;
  work_date: string;
  clock_in: string | null;
  clock_out: string | null;
  worked_minutes: number | null;
  status: AttendanceStatus;
};

const COLUMNS = "id, work_date, clock_in, clock_out, worked_minutes, status";

const toDomain = (r: Row): AttendanceRecord => ({
  id: r.id,
  workDate: r.work_date,
  clockIn: r.clock_in,
  clockOut: r.clock_out,
  workedMinutes: r.worked_minutes,
  status: r.status,
});

type ClockOutRow = {
  worked_minutes: number;
  extra_minutes: number;
  points_earned: number;
};

const toClockOutResult = (r: ClockOutRow): ClockOutResult => ({
  workedMinutes: r.worked_minutes,
  extraMinutes: r.extra_minutes,
  pointsEarned: r.points_earned,
});

type HistoryRow = Row & {
  is_edited: boolean;
  points_ledger: { points: number }[] | null;
};

export const attendanceRepository = {
  /** Most recent attendance records for a user (newest first). */
  async findRecent(
    supabase: SupabaseClient,
    userId: string,
    limit: number,
  ): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from("attendance")
      .select(COLUMNS)
      .eq("user_id", userId)
      .order("work_date", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as Row[]).map(toDomain);
  },

  /** Clock in via the atomic, server-authoritative RPC. */
  async clockIn(supabase: SupabaseClient, coords: GeoCoords): Promise<void> {
    const { error } = await supabase.rpc("clock_in", {
      p_latitude: coords.latitude,
      p_longitude: coords.longitude,
      p_accuracy: coords.accuracy,
    });
    if (error) throw error;
  },

  /** Clock out via RPC (computes duration + points, writes atomically). When
   * `awardCredits` is true, the same transaction also earns Time Credits. */
  async clockOut(
    supabase: SupabaseClient,
    coords: GeoCoords,
    awardCredits = false,
  ): Promise<ClockOutResult> {
    const { data, error } = await supabase.rpc("clock_out", {
      p_latitude: coords.latitude,
      p_longitude: coords.longitude,
      p_accuracy: coords.accuracy,
      p_award_credits: awardCredits,
    });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as ClockOutRow;
    return toClockOutResult(row);
  },

  /** Recover a missed clock-out via RPC (recomputes + flags is_edited). When
   * `awardCredits` is true, the recovered day earns Time Credits too. */
  async recover(
    supabase: SupabaseClient,
    attendanceId: string,
    clockOutIso: string,
    awardCredits = false,
  ): Promise<ClockOutResult> {
    const { data, error } = await supabase.rpc("recover_missed_clock_out", {
      p_attendance_id: attendanceId,
      p_clock_out: clockOutIso,
      p_award_credits: awardCredits,
    });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as ClockOutRow;
    return toClockOutResult(row);
  },

  /** Flip prior-day 'working' rows to 'missed_clock_out' (detection). */
  async markStaleWorkingAsMissed(
    supabase: SupabaseClient,
    userId: string,
    todayStr: string,
  ): Promise<void> {
    const { error } = await supabase
      .from("attendance")
      .update({ status: "missed_clock_out" })
      .eq("user_id", userId)
      .eq("status", "working")
      .lt("work_date", todayStr);
    if (error) throw error;
  },

  /** The oldest attendance awaiting missed-clock-out recovery, if any. */
  async findPendingRecovery(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<PendingRecovery | null> {
    const { data, error } = await supabase
      .from("attendance")
      .select("id, work_date, clock_in")
      .eq("user_id", userId)
      .eq("status", "missed_clock_out")
      .order("work_date", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id as string,
      workDate: data.work_date as string,
      clockIn: data.clock_in as string,
    };
  },

  /** A page of attendance history with per-record points (from the ledger). */
  async findHistoryPage(
    supabase: SupabaseClient,
    userId: string,
    offset: number,
    limit: number,
  ): Promise<{ records: HistoryRecord[]; total: number }> {
    const { data, error, count } = await supabase
      .from("attendance")
      .select(
        "id, work_date, clock_in, clock_out, worked_minutes, status, is_edited, points_ledger(points)",
        { count: "exact" },
      )
      .eq("user_id", userId)
      .order("work_date", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    const records = (data as HistoryRow[]).map((r) => ({
      id: r.id,
      workDate: r.work_date,
      clockIn: r.clock_in,
      clockOut: r.clock_out,
      workedMinutes: r.worked_minutes,
      status: r.status,
      isEdited: r.is_edited,
      pointsEarned: (r.points_ledger ?? []).reduce((s, p) => s + p.points, 0),
    }));
    return { records, total: count ?? 0 };
  },
};

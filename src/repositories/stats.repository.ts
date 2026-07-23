import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AttendanceStatus,
  LeaderboardEntry,
  UserStats,
  WeekDay,
} from "@/types/domain";

type StatsRow = {
  total_points: number | null;
  total_worked_minutes: number | null;
  total_completed_days: number | null;
  avg_worked_minutes: number | null;
};
type WeekRow = {
  work_date: string;
  worked_minutes: number | null;
  status: AttendanceStatus;
};
type LeaderRow = {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_points: number | null;
  rank: number | null;
};

/**
 * Reads the pre-computed SQL views. `v_user_stats` and `v_week_summary` are
 * security_invoker views (RLS-scoped to the caller); `v_leaderboard` ranks all
 * users and exposes only public columns.
 */
export const statsRepository = {
  /** All-time stats for the caller (v_user_stats). */
  async getUserStats(supabase: SupabaseClient): Promise<UserStats | null> {
    const { data, error } = await supabase
      .from("v_user_stats")
      .select(
        "total_points, total_worked_minutes, total_completed_days, avg_worked_minutes",
      )
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as StatsRow;
    return {
      totalPoints: Number(row.total_points ?? 0),
      totalWorkedMinutes: Number(row.total_worked_minutes ?? 0),
      totalCompletedDays: Number(row.total_completed_days ?? 0),
      avgWorkedMinutes: Number(row.avg_worked_minutes ?? 0),
    };
  },

  /** The caller's last 7 days of attendance (v_week_summary). */
  async getWeekSummary(supabase: SupabaseClient): Promise<WeekDay[]> {
    const { data, error } = await supabase
      .from("v_week_summary")
      .select("work_date, worked_minutes, status")
      .order("work_date", { ascending: true });
    if (error) throw error;
    return (data as WeekRow[]).map((r) => ({
      workDate: r.work_date,
      workedMinutes: r.worked_minutes,
      status: r.status,
    }));
  },

  /** Top-ranked users (v_leaderboard), public columns only. */
  async getLeaderboardTop(
    supabase: SupabaseClient,
    limit: number,
  ): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from("v_leaderboard")
      .select("user_id, full_name, avatar_url, total_points, rank")
      .order("rank", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data as LeaderRow[]).map((r) => ({
      userId: r.user_id,
      name: r.full_name,
      avatarUrl: r.avatar_url,
      points: Number(r.total_points ?? 0),
      rank: Number(r.rank ?? 0),
    }));
  },
};

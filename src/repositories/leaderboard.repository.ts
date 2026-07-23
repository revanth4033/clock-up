import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeaderboardRow } from "@/types/domain";

type RpcRow = {
  user_id: string;
  full_name: string;
  designation: string;
  office_name: string;
  avatar_url: string | null;
  points: number;
  completed_days: number;
  last_completion_at: string | null;
  rank: number;
};

export const leaderboardRepository = {
  /** Full ranked list for a period via the get_leaderboard RPC. */
  async getLeaderboard(
    supabase: SupabaseClient,
    period: string,
  ): Promise<LeaderboardRow[]> {
    const { data, error } = await supabase.rpc("get_leaderboard", {
      p_period: period,
    });
    if (error) throw error;
    return (data as RpcRow[]).map((r) => ({
      userId: r.user_id,
      name: r.full_name,
      designation: r.designation,
      officeName: r.office_name,
      avatarUrl: r.avatar_url,
      points: Number(r.points),
      completedDays: Number(r.completed_days),
      rank: Number(r.rank),
    }));
  },

  /** The caller's all-time rank (from v_leaderboard). */
  async getMyRank(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<number | null> {
    const { data, error } = await supabase
      .from("v_leaderboard")
      .select("rank")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data ? Number((data as { rank: number }).rank) : null;
  },
};

import type { SupabaseClient } from "@supabase/supabase-js";

export type PointsEntry = { points: number; createdAt: string };

type Row = { points: number; created_at: string };

export const pointsRepository = {
  /** Ledger entries for a user since a given ISO timestamp (newest first).
   * The dashboard sums these for the "today"/"this week" figures — it never
   * awards points (that is the Attendance engine's job). */
  async findSince(
    supabase: SupabaseClient,
    userId: string,
    sinceIso: string,
  ): Promise<PointsEntry[]> {
    const { data, error } = await supabase
      .from("points_ledger")
      .select("points, created_at")
      .eq("user_id", userId)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Row[]).map((r) => ({
      points: r.points,
      createdAt: r.created_at,
    }));
  },
};

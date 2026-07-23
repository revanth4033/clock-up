import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth.service";
import { leaderboardRepository } from "@/repositories/leaderboard.repository";
import { statsRepository } from "@/repositories/stats.repository";
import { pointsRepository } from "@/repositories/points.repository";
import type { LeaderboardRow } from "@/types/domain";

export type LeaderboardPeriod = "today" | "week" | "month" | "all";
export const LEADERBOARD_PERIODS: LeaderboardPeriod[] = [
  "today",
  "week",
  "month",
  "all",
];
const PAGE_SIZE = 10;

export function normalizePeriod(value: string | undefined): LeaderboardPeriod {
  return (LEADERBOARD_PERIODS as string[]).includes(value ?? "")
    ? (value as LeaderboardPeriod)
    : "all";
}

export type LeaderboardData = {
  period: LeaderboardPeriod;
  page: number;
  totalPages: number;
  total: number;
  rows: (LeaderboardRow & { isCurrentUser: boolean })[];
  currentUserId: string;
  summary: {
    name: string;
    rank: number | null;
    totalPoints: number;
    weekPoints: number;
    todayPoints: number;
    completedDays: number;
  };
};

function startOfWeekUtc(d: Date): Date {
  const day = d.getUTCDay(); // 0 = Sun … 6 = Sat
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff),
  );
}

/**
 * Read-only leaderboard assembly. Four independent queries run in parallel:
 * the period ranking (RPC), the caller's all-time rank, all-time stats, and the
 * recent points ledger (for the today/week summary figures). Pagination + the
 * current-user highlight are applied here; no attendance logic runs.
 */
export async function getLeaderboard(
  period: LeaderboardPeriod,
  page: number,
): Promise<LeaderboardData | null> {
  const user = await getCurrentUser();
  if (!user?.profile) return null;

  const supabase = await createClient();
  const userId = user.profile.id;

  const now = new Date();
  const todayStartMs = new Date(
    `${now.toISOString().slice(0, 10)}T00:00:00.000Z`,
  ).getTime();
  const weekStart = startOfWeekUtc(now);
  const weekStartMs = weekStart.getTime();

  const [ranked, myRank, stats, pointsRows] = await Promise.all([
    leaderboardRepository.getLeaderboard(supabase, period),
    leaderboardRepository.getMyRank(supabase, userId),
    statsRepository.getUserStats(supabase),
    pointsRepository.findSince(supabase, userId, weekStart.toISOString()),
  ]);

  const total = ranked.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;
  const rows = ranked
    .slice(offset, offset + PAGE_SIZE)
    .map((r) => ({ ...r, isCurrentUser: r.userId === userId }));

  const todayPoints = pointsRows
    .filter((p) => new Date(p.createdAt).getTime() >= todayStartMs)
    .reduce((s, p) => s + p.points, 0);
  const weekPoints = pointsRows
    .filter((p) => new Date(p.createdAt).getTime() >= weekStartMs)
    .reduce((s, p) => s + p.points, 0);

  return {
    period,
    page: safePage,
    totalPages,
    total,
    rows,
    currentUserId: userId,
    summary: {
      name: user.profile.fullName,
      rank: myRank,
      totalPoints: stats?.totalPoints ?? 0,
      weekPoints,
      todayPoints,
      completedDays: stats?.totalCompletedDays ?? 0,
    },
  };
}

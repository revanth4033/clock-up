import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth.service";
import { detectMissedClockOuts } from "./attendance.service";
import { attendanceRepository } from "@/repositories/attendance.repository";
import { pointsRepository } from "@/repositories/points.repository";
import { statsRepository } from "@/repositories/stats.repository";
import {
  DAILY_GOAL_MINUTES,
  WEEKLY_GOAL_MINUTES,
} from "@/constants/attendance";
import type {
  AttendanceRecord,
  LeaderboardEntry,
  PendingRecovery,
} from "@/types/domain";

export type TodayState =
  "not_started" | "working" | "completed" | "missed_clock_out" | "incomplete";

export type DashboardData = {
  profile: { fullName: string; designation: string; officeName: string };
  today: {
    state: TodayState;
    clockIn: string | null;
    clockOut: string | null;
    workedMinutes: number | null;
  };
  workingHours: { workedMinutes: number; goalMinutes: number };
  weekly: {
    daysPresent: number;
    totalMinutes: number;
    averageMinutes: number;
    goalMinutes: number;
  };
  points: { today: number; week: number; total: number };
  leaderboard: (LeaderboardEntry & { isCurrentUser: boolean })[];
  recent: AttendanceRecord[];
  pendingRecovery: PendingRecovery | null;
};

const RECENT_LIMIT = 5;
const LEADERBOARD_LIMIT = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

const utcDate = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Assembles everything the dashboard renders in a single call. All aggregation
 * lives here (not in the UI); queries run in parallel and never overlap:
 * profile (shared via cache), recent attendance, week summary, all-time stats,
 * recent points, and the leaderboard. Returns null if there is no profile.
 */
export async function getDashboardData(): Promise<DashboardData | null> {
  const user = await getCurrentUser();
  if (!user?.profile) return null;

  const supabase = await createClient();
  const userId = user.profile.id;

  const now = new Date();
  const todayStr = utcDate(now);
  const todayStartMs = new Date(`${todayStr}T00:00:00.000Z`).getTime();
  const weekAgoIso = new Date(now.getTime() - 7 * DAY_MS).toISOString();

  // Detection runs first so a flipped 'missed_clock_out' is reflected below.
  await detectMissedClockOuts(supabase, userId, todayStr);

  const [recent, weekRows, stats, pointsRows, leaderboard, pendingRecovery] =
    await Promise.all([
      attendanceRepository.findRecent(supabase, userId, RECENT_LIMIT),
      statsRepository.getWeekSummary(supabase),
      statsRepository.getUserStats(supabase),
      pointsRepository.findSince(supabase, userId, weekAgoIso),
      statsRepository.getLeaderboardTop(supabase, LEADERBOARD_LIMIT),
      attendanceRepository.findPendingRecovery(supabase, userId),
    ]);

  const todayRecord = recent.find((r) => r.workDate === todayStr) ?? null;

  const daysPresent = weekRows.length;
  const totalMinutes = weekRows.reduce(
    (sum, r) => sum + (r.workedMinutes ?? 0),
    0,
  );
  const averageMinutes =
    daysPresent > 0 ? Math.round(totalMinutes / daysPresent) : 0;

  const todayPoints = pointsRows
    .filter((p) => new Date(p.createdAt).getTime() >= todayStartMs)
    .reduce((sum, p) => sum + p.points, 0);
  const weekPoints = pointsRows.reduce((sum, p) => sum + p.points, 0);

  return {
    profile: {
      fullName: user.profile.fullName,
      designation: user.profile.designation,
      officeName: user.profile.officeName,
    },
    today: {
      state: todayRecord ? todayRecord.status : "not_started",
      clockIn: todayRecord?.clockIn ?? null,
      clockOut: todayRecord?.clockOut ?? null,
      workedMinutes: todayRecord?.workedMinutes ?? null,
    },
    workingHours: {
      workedMinutes: todayRecord?.workedMinutes ?? 0,
      goalMinutes: DAILY_GOAL_MINUTES,
    },
    weekly: {
      daysPresent,
      totalMinutes,
      averageMinutes,
      goalMinutes: WEEKLY_GOAL_MINUTES,
    },
    points: {
      today: todayPoints,
      week: weekPoints,
      total: stats?.totalPoints ?? 0,
    },
    leaderboard: leaderboard.map((e) => ({
      ...e,
      isCurrentUser: e.userId === userId,
    })),
    recent,
    pendingRecovery,
  };
}

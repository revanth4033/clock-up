import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth.service";
import { attendanceRepository } from "@/repositories/attendance.repository";
import { HISTORY_PAGE_SIZE } from "@/constants/attendance";
import type { ServiceResult } from "./types";
import type { ClockOutResult, GeoCoords, HistoryRecord } from "@/types/domain";

const ERROR_MESSAGES: Record<string, string> = {
  ALREADY_CLOCKED_IN: "You've already clocked in today.",
  ALREADY_CLOCKED_OUT: "You've already completed today's attendance.",
  NOT_CLOCKED_IN: "Please clock in before clocking out.",
  OUTSIDE_GEOFENCE: "You must be within your office location to continue.",
  INVALID_CLOCK_OUT:
    "That clock-out time isn't valid — check it and try again.",
  ALREADY_COMPLETED: "This attendance is already complete.",
  NOT_FOUND: "Attendance record not found.",
  NO_OFFICE: "No office is configured for your account.",
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
  if (code === "SERVER_ERROR") console.error("[attendance] RPC error:", raw);
  return { code, message: ERROR_MESSAGES[code] };
}

export async function clockIn(coords: GeoCoords): Promise<ServiceResult> {
  const supabase = await createClient();
  try {
    await attendanceRepository.clockIn(supabase, coords);
    return { ok: true, message: "Clocked in successfully.", data: null };
  } catch (e) {
    const { code, message } = mapError(e);
    return { ok: false, code, message };
  }
}

export async function clockOut(
  coords: GeoCoords,
): Promise<ServiceResult<ClockOutResult>> {
  const supabase = await createClient();
  try {
    const result = await attendanceRepository.clockOut(supabase, coords);
    return { ok: true, message: "Clocked out successfully.", data: result };
  } catch (e) {
    const { code, message } = mapError(e);
    return { ok: false, code, message };
  }
}

export async function recoverMissedClockOut(
  attendanceId: string,
  clockOutIso: string,
): Promise<ServiceResult<ClockOutResult>> {
  const supabase = await createClient();
  try {
    const result = await attendanceRepository.recover(
      supabase,
      attendanceId,
      clockOutIso,
    );
    return { ok: true, message: "Attendance updated.", data: result };
  } catch (e) {
    const { code, message } = mapError(e);
    return { ok: false, code, message };
  }
}

/**
 * Detection (BRD §12): flip any prior-day 'working' rows to 'missed_clock_out'.
 * Called on dashboard load (the user's next visit after forgetting to clock out).
 * Takes the caller's client so it shares the request's session.
 */
export async function detectMissedClockOuts(
  supabase: SupabaseClient,
  userId: string,
  todayStr: string,
): Promise<void> {
  await attendanceRepository.markStaleWorkingAsMissed(
    supabase,
    userId,
    todayStr,
  );
}

export async function getAttendanceHistory(page: number): Promise<
  ServiceResult<{
    records: HistoryRecord[];
    page: number;
    totalPages: number;
    total: number;
    officeName: string;
  }>
> {
  const user = await getCurrentUser();
  if (!user?.profile) {
    return {
      ok: false,
      code: "AUTH_REQUIRED",
      message: ERROR_MESSAGES.AUTH_REQUIRED,
    };
  }
  const supabase = await createClient();
  const safePage = Math.max(1, Math.floor(page) || 1);
  const offset = (safePage - 1) * HISTORY_PAGE_SIZE;
  const { records, total } = await attendanceRepository.findHistoryPage(
    supabase,
    user.profile.id,
    offset,
    HISTORY_PAGE_SIZE,
  );
  const totalPages = Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE));
  return {
    ok: true,
    message: "OK",
    data: {
      records,
      page: safePage,
      totalPages,
      total,
      officeName: user.profile.officeName,
    },
  };
}

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth.service";
import { usersRepository } from "@/repositories/users.repository";
import { statsRepository } from "@/repositories/stats.repository";
import { attendanceRepository } from "@/repositories/attendance.repository";
import type { ServiceResult } from "./types";
import type { AttendanceRecord, UserProfile, UserStats } from "@/types/domain";

const RECENT_LIMIT = 5;
const EMPTY_STATS: UserStats = {
  totalPoints: 0,
  totalWorkingDays: 0,
  totalWorkedMinutes: 0,
  totalCompletedDays: 0,
  avgWorkedMinutes: 0,
};

export type ProfileData = {
  profile: UserProfile;
  stats: UserStats;
  recent: AttendanceRecord[];
};

/** Read-only profile view: profile (shared via cache) + all-time stats +
 * recent attendance. Stats/recent run in parallel; nothing is recalculated. */
export async function getProfileData(): Promise<ProfileData | null> {
  const user = await getCurrentUser();
  if (!user?.profile) return null;

  const supabase = await createClient();
  const [stats, recent] = await Promise.all([
    statsRepository.getUserStats(supabase),
    attendanceRepository.findRecent(supabase, user.profile.id, RECENT_LIMIT),
  ]);

  return { profile: user.profile, stats: stats ?? EMPTY_STATS, recent };
}

/** Updates the caller's display name (the only editable profile field, per ASD). */
export async function updateProfileName(
  fullName: string,
): Promise<ServiceResult> {
  const user = await getCurrentUser();
  if (!user?.profile) {
    return {
      ok: false,
      code: "AUTH_REQUIRED",
      message: "Please sign in again.",
    };
  }
  const supabase = await createClient();
  try {
    await usersRepository.updateName(supabase, user.profile.id, fullName);
    return { ok: true, message: "Profile updated.", data: null };
  } catch (e) {
    console.error("[profile] updateName failed:", e);
    return {
      ok: false,
      code: "SERVER_ERROR",
      message: "Couldn't update your profile. Please try again.",
    };
  }
}

/**
 * Change password for a signed-in user. Re-verifies the current password
 * (via the auth architecture) before updating — reusing Supabase Auth, not
 * modifying it.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ServiceResult> {
  const user = await getCurrentUser();
  if (!user?.email) {
    return {
      ok: false,
      code: "AUTH_REQUIRED",
      message: "Please sign in again.",
    };
  }
  const supabase = await createClient();

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) {
    return {
      ok: false,
      code: "INVALID_CREDENTIALS",
      message: "Your current password is incorrect.",
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) {
    if (updateError.message.toLowerCase().includes("different")) {
      return {
        ok: false,
        code: "INVALID_REQUEST",
        message: "Your new password must be different from your current one.",
      };
    }
    return { ok: false, code: "SERVER_ERROR", message: updateError.message };
  }

  return { ok: true, message: "Password changed successfully.", data: null };
}

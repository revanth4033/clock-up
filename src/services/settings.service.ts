import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth.service";
import { settingsRepository } from "@/repositories/settings.repository";
import type { ServiceResult } from "./types";
import type { Theme, UserSettings } from "@/types/domain";

const DEFAULT_SETTINGS: UserSettings = {
  theme: "system",
  notificationsEnabled: true,
};

/**
 * The caller's persisted preferences, or the defaults if the row is missing.
 * Wrapped in React `cache` so the dashboard layout and the settings page share
 * a single `user_settings` read within one request.
 */
export const getSettings = cache(async (): Promise<UserSettings | null> => {
  const user = await getCurrentUser();
  if (!user?.profile) return null;
  const supabase = await createClient();
  const settings = await settingsRepository.find(supabase);
  return settings ?? DEFAULT_SETTINGS;
});

/** A partial update to the caller's preferences (theme and/or notifications). */
export type SettingsUpdate = Partial<{
  theme: Theme;
  notificationsEnabled: boolean;
}>;

export async function updateSettings(
  update: SettingsUpdate,
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
    await settingsRepository.update(supabase, user.profile.id, {
      ...(update.theme !== undefined && { theme: update.theme }),
      ...(update.notificationsEnabled !== undefined && {
        notifications_enabled: update.notificationsEnabled,
      }),
    });
    return { ok: true, message: "Settings updated.", data: null };
  } catch (e) {
    console.error("[settings] update failed:", e);
    return {
      ok: false,
      code: "SERVER_ERROR",
      message: "Couldn't save your settings. Please try again.",
    };
  }
}

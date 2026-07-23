import type { SupabaseClient } from "@supabase/supabase-js";
import type { Theme, UserSettings } from "@/types/domain";

type Row = {
  theme: Theme;
  notifications_enabled: boolean;
};

const COLUMNS = "theme, notifications_enabled";

const toDomain = (r: Row): UserSettings => ({
  theme: r.theme,
  notificationsEnabled: r.notifications_enabled,
});

/** Column patch (snake_case) for a partial settings update. */
type SettingsPatch = Partial<{
  theme: Theme;
  notifications_enabled: boolean;
}>;

/**
 * Reads/writes the caller's single `user_settings` row. The row is created for
 * every user by the `on_auth_user_created` trigger, so it always exists; RLS
 * scopes every query to the owner.
 */
export const settingsRepository = {
  async find(supabase: SupabaseClient): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from("user_settings")
      .select(COLUMNS)
      .maybeSingle();
    if (error) throw error;
    return data ? toDomain(data as Row) : null;
  },

  async update(
    supabase: SupabaseClient,
    userId: string,
    patch: SettingsPatch,
  ): Promise<void> {
    const { error } = await supabase
      .from("user_settings")
      .update(patch)
      .eq("user_id", userId);
    if (error) throw error;
  },
};

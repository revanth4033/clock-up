"use client";

import { useTheme } from "next-themes";
import { settingsApi } from "./api";
import type { Theme } from "@/types/domain";

/**
 * Single write-path for the theme preference: applies it live via next-themes
 * and persists it to `user_settings` (best-effort). Used by both the header
 * toggle and the Settings appearance control so the DB stays authoritative and
 * the two never diverge.
 */
export function useThemePreference() {
  const { theme, setTheme } = useTheme();

  function selectTheme(next: Theme) {
    setTheme(next);
    // Fire-and-forget: the theme is already applied locally; a failed save is a
    // low-stakes preference, not worth blocking the UI or surfacing an error.
    void settingsApi.update({ theme: next });
  }

  return { theme, selectTheme };
}

"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import type { Theme } from "@/types/domain";

/**
 * Reconciles next-themes to the persisted preference once per load. next-themes
 * restores from localStorage (fast, no flash on the usual device); this seeds
 * the DB value on a fresh device/browser where localStorage is empty, so the
 * saved theme follows the user. Runs a single time — it never fights later
 * user changes (those flow through useThemePreference and update the DB too).
 */
export function ThemeSync({ theme: dbTheme }: { theme: Theme }) {
  const { theme, setTheme } = useTheme();
  const reconciled = useRef(false);

  useEffect(() => {
    if (reconciled.current) return;
    reconciled.current = true;
    if (dbTheme !== theme) setTheme(dbTheme);
  }, [dbTheme, theme, setTheme]);

  return null;
}

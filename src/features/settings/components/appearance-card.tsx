"use client";

import { useState } from "react";
import { Monitor, Moon, Palette, Sun } from "lucide-react";
import { DashboardCard } from "@/features/dashboard/components/dashboard-card";
import { useThemePreference } from "../use-theme-preference";
import { cn } from "@/lib/utils";
import type { Theme } from "@/types/domain";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const satisfies ReadonlyArray<{
  value: Theme;
  label: string;
  icon: typeof Sun;
}>;

/**
 * Theme selection. Seeds from the persisted preference (DB) and, on change,
 * applies it live via next-themes and re-persists — both through
 * useThemePreference so the header toggle and this control stay in sync.
 */
export function AppearanceCard({ initialTheme }: { initialTheme: Theme }) {
  const { selectTheme } = useThemePreference();
  const [selected, setSelected] = useState<Theme>(initialTheme);

  function choose(value: Theme) {
    setSelected(value);
    selectTheme(value);
  }

  return (
    <DashboardCard title="Appearance" icon={Palette}>
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">
          Choose how ClockUp looks. &ldquo;System&rdquo; follows your device
          setting.
        </p>
        <div
          role="radiogroup"
          aria-label="Theme"
          className="border-border bg-muted/40 grid grid-cols-3 gap-1 rounded-xl border p-1"
        >
          {OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = selected === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => choose(value)}
                className={cn(
                  "focus-visible:ring-ring/50 flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px]",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </DashboardCard>
  );
}

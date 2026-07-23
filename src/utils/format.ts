/** Presentation helpers (pure, no business logic). */

/** 465 -> "7h 45m", 60 -> "1h", 45 -> "45m", 0 -> "0m". */
export function formatMinutes(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

/** ISO timestamp -> "9:04 AM"; null -> "—". */
export function formatTimeOfDay(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** "2026-07-23" -> "Thu, Jul 23". */
export function formatShortDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateStr}T00:00:00`));
}

/** Clamps a 0..1 ratio to a whole percentage. */
export function toPercent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((value / max) * 100));
}

/** "Revanth Banisetti" -> "RB". */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

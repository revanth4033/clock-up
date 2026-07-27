import type { DayType } from "@/types/domain";

/**
 * A non-working day (weekend or holiday) on which the employee has NOT clocked
 * in. When true, the Today's Work cards show a calm "day off" state instead of
 * implying a missed obligation. If they did clock in, `started` is true and the
 * cards fall back to real activity — working on a day off still counts. Mirrors
 * the resolution the Today's Work hero uses, so the whole section agrees.
 */
export function isRestDay(dayType: DayType, started: boolean): boolean {
  return !started && (dayType === "weekend" || dayType === "holiday");
}

/** Domain models (camelCase) mapped from DB rows by the repository layer. */

export type OfficeLocation = {
  id: string;
  officeName: string;
  latitude: number;
  longitude: number;
  allowedRadius: number;
};

export type UserProfile = {
  id: string;
  employeeId: string;
  fullName: string;
  officeEmail: string;
  designation: string;
  officeLocationId: string;
  officeName: string;
  avatarUrl: string | null;
  createdAt: string;
};

/** Persisted attendance statuses (matches the DB enum). "Not Started" is a
 * UI-only state (no row exists), represented separately. */
export type AttendanceStatus =
  "working" | "completed" | "missed_clock_out" | "incomplete";

export type AttendanceRecord = {
  id: string;
  workDate: string; // YYYY-MM-DD
  clockIn: string | null;
  clockOut: string | null;
  workedMinutes: number | null;
  status: AttendanceStatus;
};

export type WeekDay = {
  workDate: string;
  workedMinutes: number | null;
  status: AttendanceStatus;
};

export type UserStats = {
  totalPoints: number;
  totalWorkingDays: number;
  totalWorkedMinutes: number;
  totalCompletedDays: number;
  avgWorkedMinutes: number;
};

/** Theme preference (matches the DB `theme` enum + next-themes values). */
export type Theme = "light" | "dark" | "system";

/** The caller's persisted preferences (one row per user in `user_settings`). */
export type UserSettings = {
  theme: Theme;
  notificationsEnabled: boolean;
};

export type LeaderboardEntry = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  points: number;
  rank: number;
};

export type GeoCoords = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

/** Result of a clock-out / recovery (computed server-side). */
export type ClockOutResult = {
  workedMinutes: number;
  extraMinutes: number;
  pointsEarned: number;
};

/** A row for the Attendance History page. */
export type HistoryRecord = {
  id: string;
  workDate: string;
  clockIn: string | null;
  clockOut: string | null;
  workedMinutes: number | null;
  status: AttendanceStatus;
  isEdited: boolean;
  pointsEarned: number;
};

/** A prior-day attendance awaiting missed-clock-out recovery. */
export type PendingRecovery = {
  id: string;
  workDate: string;
  clockIn: string;
};

/**
 * Time Credits — subsystem introduced as a staged migration (see docs/adr/ADR-008).
 *
 * Phase 2 builds the full infrastructure (table / RLS / view / RPCs / repository
 * / service) but wires nothing into the running app: no credit is earned at
 * clock-out and none is consumed. `credits` is signed — a future redemption
 * records a negative "used" entry — so no type changes as later phases land.
 */
export type TimeCreditEntryType =
  "earned" | "used" | "manual_adjustment" | "expired" | "bonus";

/** A single append-only `time_credit_ledger` row (domain shape). */
export type TimeCreditEntry = {
  id: string;
  attendanceId: string | null;
  entryType: TimeCreditEntryType;
  credits: number; // positive = earned, negative = used (redemption)
  reason: string;
  createdAt: string;
};

/** A user's derived credit position (`v_time_credit_balance`). `used` is a
 * positive magnitude; `balance` = earned − used. */
export type TimeCreditSummary = {
  earned: number;
  used: number;
  balance: number;
};

/** Redemption hold lifecycle (see ADR-009). */
export type RedemptionStatus = "pending" | "applied" | "cancelled" | "released";

/** A redemption hold row (`time_credit_redemption`). Phase 4B: only `pending` /
 * `cancelled` occur; `applied`/`released` arrive with settlement in Phase 4D. */
export type RedemptionHold = {
  id: string;
  attendanceId: string;
  requestedCredits: number;
  appliedCredits: number | null;
  status: RedemptionStatus;
  createdAt: string;
};

/** Redemption-aware balance: `available` = `balance − reserved` (pending holds). */
export type CreditAvailability = {
  balance: number;
  reserved: number;
  available: number;
};

/** A ranked leaderboard row (public columns only) for a given period. */
export type LeaderboardRow = {
  userId: string;
  name: string;
  designation: string;
  officeName: string;
  avatarUrl: string | null;
  points: number;
  completedDays: number;
  rank: number;
};

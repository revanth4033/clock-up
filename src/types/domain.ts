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

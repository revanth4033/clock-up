-- ClockUp — enum types
-- Source of truth: DDD (Attendance status enum) + BRD §9.
--
-- NOTE: "Not Started" is intentionally NOT a database status. An attendance row
-- only exists after a successful Clock In, so "Not Started" is a UI-only state
-- (approved decision), never persisted.

create type public.attendance_status as enum (
  'working',
  'completed',
  'missed_clock_out',
  'incomplete'
);

-- Theme preference for User Settings (DSD: light-first, with dark parity).
create type public.theme as enum (
  'light',
  'dark',
  'system'
);

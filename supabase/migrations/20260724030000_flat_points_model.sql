-- ClockUp — Phase 4C: flat-100 Points model (ADR-009).
--
-- Points move from "100 + overtime bonus (10 per 15 min, max 140), based on
-- worked minutes" to a flat "100 if the day meets the 9h goal, else 0". Time
-- Credits, earning, redemption infrastructure, and the attendance flow are all
-- UNTOUCHED. Counted Time = Worked for this phase; the redemption/settlement
-- integration (Counted = Worked + Applied) is Phase 4D.
--
-- The change is isolated to public.points_for_minutes — the single helper that
-- clock_out and recover_missed_clock_out already call. Redefining it to return
-- base = 100/0 and bonus = 0 makes those RPCs write exactly one 'Daily goal (9h)'
-- row (or none) with no 'Overtime bonus' row, WITHOUT editing the attendance
-- functions. In Phase 4D, clock_out will pass Counted instead of Worked — a
-- one-argument change; the flat rule (>= 540 → 100) is unaffected.

create or replace function public.points_for_minutes(worked integer)
returns table (base integer, bonus integer)
language sql
immutable
parallel safe
as $$
  -- Flat model (ADR-009): 100 at/above the 9h goal (540 min), else 0.
  -- `bonus` is retained (always 0) so the calling RPCs need no change; the
  -- overtime bonus no longer exists.
  select
    case when worked >= 540 then 100 else 0 end,
    0;
$$;

-- ── Historical normalization ──────────────────────────────────────────────────
-- Replace every attendance-linked points row (old 100 + bonus rows) with exactly
-- one flat 100 per completed day that met the goal. `worked_minutes` is preserved
-- on `attendance`, so the pre-migration values remain fully recomputable — see
-- the rollback note below. Non-attendance points rows (attendance_id is null,
-- e.g. future manual awards) are intentionally left untouched.
delete from public.points_ledger where attendance_id is not null;

insert into public.points_ledger (user_id, attendance_id, reason, points, created_at)
select
  a.user_id,
  a.id,
  'Daily goal (9h)',
  100,
  coalesce(a.clock_out, a.created_at)   -- dates points to the work day (period leaderboards)
from public.attendance a
where a.status = 'completed' and a.worked_minutes >= 540;

-- ── Rollback considerations ───────────────────────────────────────────────────
-- 1. Calculation: revert with a migration redefining points_for_minutes to the
--    old formula (100 + least(floor((worked-540)/15)*10, 40)).
-- 2. History: the old per-day points are re-derivable from attendance.worked_minutes
--    (unchanged) via that old formula — the normalization is reversible by
--    recomputation, not by undo. Take a points_ledger snapshot / rely on Supabase
--    PITR before running in production.

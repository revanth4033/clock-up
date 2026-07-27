-- v_week_summary previously used a rolling last-7-days window
--   (work_date >= current_date - interval '6 days')
-- which the dashboard labels "This Week". On a Monday that window is dominated
-- by the PREVIOUS week's data, so the card showed last week's totals.
--
-- Fix: represent the CURRENT calendar week, Monday-based, matching
-- WEEKLY_GOAL_MINUTES (a 5-day week) and the leaderboard's Monday week start.
-- `date_trunc('week', ...)` in Postgres returns the Monday of the week.
--
-- `create or replace view` preserves the existing grant + security_invoker.
create or replace view public.v_week_summary
with (security_invoker = on) as
select
  a.user_id,
  a.work_date,
  a.clock_in,
  a.clock_out,
  a.worked_minutes,
  a.status
from public.attendance a
where a.work_date >= date_trunc('week', current_date)::date
order by a.work_date;

-- ClockUp — SQL views for derived data (DDD: never store ranks/averages/hours).

-- Per-user statistics. security_invoker = on → the caller's RLS applies, so a
-- user only ever sees their OWN aggregated row.
create view public.v_user_stats
with (security_invoker = on) as
select
  u.id                                                  as user_id,
  u.full_name,
  coalesce(sum(a.worked_minutes), 0)                    as total_worked_minutes,
  count(a.id) filter (where a.status = 'completed')     as total_completed_days,
  count(a.id)                                           as total_attendance_days,
  coalesce(
    (select sum(p.points) from public.points_ledger p where p.user_id = u.id),
    0
  )                                                     as total_points,
  coalesce(round(avg(a.worked_minutes)::numeric, 0), 0) as avg_worked_minutes
from public.users u
left join public.attendance a on a.user_id = u.id
group by u.id, u.full_name;

grant select on public.v_user_stats to authenticated;

-- Last 7 calendar days of the caller's own attendance (dashboard weekly strip).
-- security_invoker = on → restricted to the caller's own rows by RLS.
create view public.v_week_summary
with (security_invoker = on) as
select
  a.user_id,
  a.work_date,
  a.clock_in,
  a.clock_out,
  a.worked_minutes,
  a.status
from public.attendance a
where a.work_date >= (current_date - interval '6 days')
order by a.work_date;

grant select on public.v_week_summary to authenticated;

-- All-time leaderboard. security_invoker = off (owner semantics) so it can rank
-- across ALL users while exposing ONLY public columns (name, avatar, points,
-- hours, rank) — matching BRD §20. Ranking order per BRD §8:
--   1) total points desc, 2) goal completions desc, 3) most recent completion.
-- Each metric is pre-aggregated in a CTE to avoid join fan-out between the
-- points and attendance tables.
create view public.v_leaderboard as
with points as (
  select user_id, sum(points) as total_points
  from public.points_ledger
  group by user_id
),
att as (
  select
    user_id,
    count(*) filter (where status = 'completed')       as total_completed_days,
    sum(worked_minutes)                                as total_worked_minutes,
    max(clock_out) filter (where status = 'completed') as last_completion_at
  from public.attendance
  group by user_id
)
select
  u.id                                  as user_id,
  u.full_name,
  u.avatar_url,
  coalesce(points.total_points, 0)      as total_points,
  coalesce(att.total_completed_days, 0) as total_completed_days,
  coalesce(att.total_worked_minutes, 0) as total_worked_minutes,
  att.last_completion_at,
  rank() over (
    order by
      coalesce(points.total_points, 0) desc,
      coalesce(att.total_completed_days, 0) desc,
      att.last_completion_at desc nulls last
  ) as rank
from public.users u
left join points on points.user_id = u.id
left join att on att.user_id = u.id;

-- Owner-semantics view has no RLS of its own — restrict it to signed-in users.
revoke all on public.v_leaderboard from anon;
grant select on public.v_leaderboard to authenticated;

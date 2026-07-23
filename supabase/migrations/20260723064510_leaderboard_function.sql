-- ClockUp — parameterized leaderboard (BRD §8: Today / This Week / This Month /
-- All Time). One reusable function instead of four near-identical views.
--
-- Ranks ALL users by points earned within the period, then goal completions,
-- then most-recent completion (BRD §8 order). Points come from points_ledger
-- (created_at within period); completions from attendance (work_date within
-- period). SECURITY DEFINER so it can rank across all users (like v_leaderboard),
-- exposing only public columns. Read-only — it never writes.

create or replace function public.get_leaderboard(p_period text)
returns table (
  user_id uuid,
  full_name text,
  designation text,
  office_name text,
  avatar_url text,
  points integer,
  completed_days integer,
  last_completion_at timestamptz,
  rank integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with bounds as (
    select
      case p_period
        when 'today' then date_trunc('day', now())
        when 'week' then date_trunc('week', now())
        when 'month' then date_trunc('month', now())
        else null
      end as start_ts,
      case p_period
        when 'today' then current_date
        when 'week' then date_trunc('week', current_date)::date
        when 'month' then date_trunc('month', current_date)::date
        else null
      end as start_date
  ),
  pts as (
    select p.user_id, sum(p.points)::int as points
    from public.points_ledger p, bounds b
    where b.start_ts is null or p.created_at >= b.start_ts
    group by p.user_id
  ),
  att as (
    select
      a.user_id,
      count(*) filter (where a.status = 'completed')::int as completed_days,
      max(a.clock_out) filter (where a.status = 'completed') as last_completion_at
    from public.attendance a, bounds b
    where b.start_date is null or a.work_date >= b.start_date
    group by a.user_id
  )
  select
    u.id,
    u.full_name,
    u.designation,
    o.office_name,
    u.avatar_url,
    coalesce(pts.points, 0),
    coalesce(att.completed_days, 0),
    att.last_completion_at,
    rank() over (
      order by
        coalesce(pts.points, 0) desc,
        coalesce(att.completed_days, 0) desc,
        att.last_completion_at desc nulls last
    )::int
  from public.users u
  join public.office_locations o on o.id = u.office_location_id
  left join pts on pts.user_id = u.id
  left join att on att.user_id = u.id;
$$;

revoke all on function public.get_leaderboard(text) from public;
grant execute on function public.get_leaderboard(text) to authenticated;

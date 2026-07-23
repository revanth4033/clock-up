-- ClockUp — Phase 4E: read model for per-day settlement (ADR-009).
--
-- READ ONLY: a security_invoker view that projects each attendance day once,
-- joining its settled points and credit movements. No business logic, no writes,
-- no new rules — it only aggregates existing data for the future dashboard and
-- history UI. Serves both "today's summary" and "attendance history" from a
-- single source (no N+1). Reuses existing indexes on attendance_id.
--
--   redeemed_credits = credits applied at settlement (positive)   = -sum(used)
--   earned_credits   = credits earned from overtime               =  sum(earned)
--   counted_minutes  = worked_minutes + redeemed_credits
--   points           = the day's flat points (100 / 0)

create view public.v_attendance_settlement
with (security_invoker = on) as
select
  a.id                                                as attendance_id,
  a.user_id,
  a.work_date,
  a.clock_in,
  a.clock_out,
  a.worked_minutes,
  a.status,
  a.is_edited,
  coalesce(pts.points, 0)::int                        as points,
  coalesce(-cr.used, 0)::int                          as redeemed_credits,
  coalesce(cr.earned, 0)::int                         as earned_credits,
  (coalesce(a.worked_minutes, 0) + coalesce(-cr.used, 0))::int as counted_minutes
from public.attendance a
left join (
  select attendance_id, sum(points) as points
  from public.points_ledger
  where attendance_id is not null
  group by attendance_id
) pts on pts.attendance_id = a.id
left join (
  select
    attendance_id,
    sum(credits) filter (where entry_type = 'used')   as used,
    sum(credits) filter (where entry_type = 'earned') as earned
  from public.time_credit_ledger
  where attendance_id is not null
  group by attendance_id
) cr on cr.attendance_id = a.id;

grant select on public.v_attendance_settlement to authenticated;

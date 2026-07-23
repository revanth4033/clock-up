-- ClockUp — Phase 3: automatic Time Credit earning. See docs/adr/ADR-008.
--
-- Extends the attendance engine so a completed day ALSO earns Time Credits
-- (1 per minute past the 9h goal), in the SAME atomic transaction as attendance
-- + points, and ONLY when the caller passes p_award_credits = true (driven by
-- the ENABLE_TIME_CREDITS feature flag in the service layer). When the flag is
-- off — the default — behaviour is byte-identical to v1.0 (no credit is
-- awarded). Points, required hours, and attendance calculations are unchanged.
--
-- Idempotency: a partial unique index on (attendance_id) where
-- entry_type = 'earned', plus INSERT ... ON CONFLICT DO NOTHING, guarantees an
-- attendance can NEVER earn credits twice (retry / recovery / duplicate call /
-- replay). A genuine DB error in the credit step propagates and rolls the whole
-- clock-out back (no inconsistent commit); only a duplicate is a silent no-op.

-- ── idempotency backstop ──────────────────────────────────────────────────────
create unique index time_credit_earned_once_per_attendance
  on public.time_credit_ledger (attendance_id)
  where entry_type = 'earned';

-- ── shared award helper (single SQL source of the earning rule) ───────────────
-- credits = max(0, worked_minutes - 540) — mirrors the Phase 1 TS helper
-- creditsForWorkedMinutes and the attendance engine's own extra-minutes math.
-- SECURITY DEFINER and revoked from clients: only the attendance RPCs call it,
-- so an employee can never award themselves credits directly.
create or replace function public.award_time_credits(
  p_user_id        uuid,
  p_attendance_id  uuid,
  p_worked_minutes integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_credits integer;
begin
  v_credits := greatest(0, coalesce(p_worked_minutes, 0) - 540);
  if v_credits <= 0 then
    return;  -- 9h (540 min) or less earns no credits
  end if;

  insert into public.time_credit_ledger (user_id, attendance_id, entry_type, credits, reason)
  values (p_user_id, p_attendance_id, 'earned', v_credits, 'Earned from working past the 9h goal')
  on conflict (attendance_id) where entry_type = 'earned' do nothing;
end;
$$;

revoke all on function public.award_time_credits(uuid, uuid, integer) from public;

-- ── clock out (recreated: adds p_award_credits + the gated credit step) ───────
drop function if exists public.clock_out(double precision, double precision, double precision);

create function public.clock_out(
  p_latitude      double precision,
  p_longitude     double precision,
  p_accuracy      double precision,
  p_award_credits boolean default false
)
returns table (worked_minutes integer, extra_minutes integer, points_earned integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_att public.attendance;
  v_office record;
  v_distance double precision;
  v_out timestamptz := now();
  v_worked integer;
  v_extra integer;
  v_base integer;
  v_bonus integer;
begin
  v_user_id := public.current_app_user_id();
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_att
  from public.attendance
  where user_id = v_user_id and work_date = current_date
  for update;
  if not found then
    raise exception 'NOT_CLOCKED_IN';
  end if;
  if v_att.status <> 'working' or v_att.clock_out is not null then
    raise exception 'ALREADY_CLOCKED_OUT';
  end if;

  select o.latitude, o.longitude, o.allowed_radius
    into v_office
  from public.office_locations o
  join public.users u on u.office_location_id = o.id
  where u.id = v_user_id;

  v_distance := public.geo_distance_meters(
    p_latitude, p_longitude,
    v_office.latitude::double precision, v_office.longitude::double precision
  );
  if v_distance > v_office.allowed_radius then
    raise exception 'OUTSIDE_GEOFENCE';
  end if;

  v_worked := greatest(0, floor(extract(epoch from (v_out - v_att.clock_in)) / 60)::int);
  v_extra := greatest(0, v_worked - 540);
  select base, bonus into v_base, v_bonus from public.points_for_minutes(v_worked);

  update public.attendance set
    clock_out = v_out,
    worked_minutes = v_worked,
    extra_minutes = v_extra,
    status = 'completed',
    clock_out_latitude = p_latitude,
    clock_out_longitude = p_longitude,
    clock_out_accuracy = p_accuracy
  where id = v_att.id;

  if v_base > 0 then
    insert into public.points_ledger (user_id, attendance_id, reason, points)
    values (v_user_id, v_att.id, 'Daily goal (9h)', v_base);
  end if;
  if v_bonus > 0 then
    insert into public.points_ledger (user_id, attendance_id, reason, points)
    values (v_user_id, v_att.id, 'Overtime bonus', v_bonus);
  end if;

  -- Time Credits (Phase 3): only when the feature flag is on. Same transaction
  -- as attendance + points and awarded AFTER them; idempotent per attendance.
  if p_award_credits then
    perform public.award_time_credits(v_user_id, v_att.id, v_worked);
  end if;

  return query select v_worked, v_extra, (v_base + v_bonus);
end;
$$;

revoke all on function public.clock_out(double precision, double precision, double precision, boolean) from public;
grant execute on function public.clock_out(double precision, double precision, double precision, boolean) to authenticated;

-- ── missed clock out recovery (recreated: same p_award_credits + credit step) ─
drop function if exists public.recover_missed_clock_out(uuid, timestamptz);

create function public.recover_missed_clock_out(
  p_attendance_id uuid,
  p_clock_out     timestamptz,
  p_award_credits boolean default false
)
returns table (worked_minutes integer, extra_minutes integer, points_earned integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_att public.attendance;
  v_worked integer;
  v_extra integer;
  v_base integer;
  v_bonus integer;
begin
  v_user_id := public.current_app_user_id();
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_att
  from public.attendance
  where id = p_attendance_id and user_id = v_user_id
  for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  if v_att.status = 'completed' then
    raise exception 'ALREADY_COMPLETED';
  end if;
  if p_clock_out <= v_att.clock_in
     or p_clock_out > v_att.clock_in + interval '24 hours' then
    raise exception 'INVALID_CLOCK_OUT';
  end if;

  v_worked := greatest(0, floor(extract(epoch from (p_clock_out - v_att.clock_in)) / 60)::int);
  v_extra := greatest(0, v_worked - 540);
  select base, bonus into v_base, v_bonus from public.points_for_minutes(v_worked);

  update public.attendance set
    clock_out = p_clock_out,
    worked_minutes = v_worked,
    extra_minutes = v_extra,
    status = 'completed',
    is_edited = true
  where id = v_att.id;

  delete from public.points_ledger where attendance_id = v_att.id;
  if v_base > 0 then
    insert into public.points_ledger (user_id, attendance_id, reason, points)
    values (v_user_id, v_att.id, 'Daily goal (9h)', v_base);
  end if;
  if v_bonus > 0 then
    insert into public.points_ledger (user_id, attendance_id, reason, points)
    values (v_user_id, v_att.id, 'Overtime bonus', v_bonus);
  end if;

  -- A recovered day earns exactly the same credits as a normal clock-out (same
  -- rule, same helper), gated by the same flag; idempotent per attendance.
  if p_award_credits then
    perform public.award_time_credits(v_user_id, v_att.id, v_worked);
  end if;

  return query select v_worked, v_extra, (v_base + v_bonus);
end;
$$;

revoke all on function public.recover_missed_clock_out(uuid, timestamptz, boolean) from public;
grant execute on function public.recover_missed_clock_out(uuid, timestamptz, boolean) to authenticated;

-- ClockUp — Phase 4D, Step 0: rename points_for_minutes → calculate_daily_points.
--
-- Architecture/naming refactor only, ZERO behaviour change. The helper answers
-- one question: "given the minutes that count toward today's goal, how many
-- points?" It now returns a single integer (the vestigial `bonus` column, always
-- 0 since Phase 4C, is dropped). clock_out / recover are updated to call it; the
-- dead 'Overtime bonus' insert (bonus was already 0) is removed. Points remain
-- flat 100/0 — identical output to Phase 4C.

create or replace function public.calculate_daily_points(counted_minutes integer)
returns integer
language sql
immutable
parallel safe
as $$
  -- Flat model (ADR-009): 100 if the counted minutes meet the 9h goal, else 0.
  select case when counted_minutes >= 540 then 100 else 0 end;
$$;

grant execute on function public.calculate_daily_points(integer) to authenticated;

-- ── clock_out: same signature/behaviour, now via calculate_daily_points ───────
create or replace function public.clock_out(
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
  v_points integer;
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
  v_points := public.calculate_daily_points(v_worked);

  update public.attendance set
    clock_out = v_out,
    worked_minutes = v_worked,
    extra_minutes = v_extra,
    status = 'completed',
    clock_out_latitude = p_latitude,
    clock_out_longitude = p_longitude,
    clock_out_accuracy = p_accuracy
  where id = v_att.id;

  if v_points > 0 then
    insert into public.points_ledger (user_id, attendance_id, reason, points)
    values (v_user_id, v_att.id, 'Daily goal (9h)', v_points);
  end if;

  if p_award_credits then
    perform public.award_time_credits(v_user_id, v_att.id, v_worked);
  end if;

  return query select v_worked, v_extra, v_points;
end;
$$;

revoke all on function public.clock_out(double precision, double precision, double precision, boolean) from public;
grant execute on function public.clock_out(double precision, double precision, double precision, boolean) to authenticated;

-- ── recover_missed_clock_out: same, via calculate_daily_points ────────────────
create or replace function public.recover_missed_clock_out(
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
  v_points integer;
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
  v_points := public.calculate_daily_points(v_worked);

  update public.attendance set
    clock_out = p_clock_out,
    worked_minutes = v_worked,
    extra_minutes = v_extra,
    status = 'completed',
    is_edited = true
  where id = v_att.id;

  delete from public.points_ledger where attendance_id = v_att.id;
  if v_points > 0 then
    insert into public.points_ledger (user_id, attendance_id, reason, points)
    values (v_user_id, v_att.id, 'Daily goal (9h)', v_points);
  end if;

  if p_award_credits then
    perform public.award_time_credits(v_user_id, v_att.id, v_worked);
  end if;

  return query select v_worked, v_extra, v_points;
end;
$$;

revoke all on function public.recover_missed_clock_out(uuid, timestamptz, boolean) from public;
grant execute on function public.recover_missed_clock_out(uuid, timestamptz, boolean) to authenticated;

-- The old helper is now unreferenced.
drop function if exists public.points_for_minutes(integer);

-- ClockUp — attendance engine (transactional, server-authoritative).
--
-- All timing, duration, points and status transitions happen INSIDE these
-- functions so they are atomic (attendance + points_ledger written together)
-- and tamper-proof (the client only supplies GPS coordinates; the server reads
-- the stored clock-in and uses now() for every timestamp — BRD §5, §10). The
-- mutation functions are SECURITY DEFINER because points_ledger is server-write
-- only under RLS; every statement is scoped to the caller via
-- public.current_app_user_id().

-- ── helpers ────────────────────────────────────────────────────────────────

-- Great-circle distance in metres (Haversine) for geofence checks (BRD §11).
create or replace function public.geo_distance_meters(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
returns double precision
language sql
immutable
parallel safe
as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2))
    * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- Points for a day's worked minutes (BRD §7): 100 at the 9h goal, +10 per extra
-- 15 minutes, capped at +40 (max 140). Base + bonus are returned separately so
-- the ledger can record them as distinct, auditable entries.
create or replace function public.points_for_minutes(worked integer)
returns table (base integer, bonus integer)
language sql
immutable
parallel safe
as $$
  select
    case when worked >= 540 then 100 else 0 end,
    case
      when worked >= 540 then least((floor((worked - 540) / 15.0))::int * 10, 40)
      else 0
    end;
$$;

-- ── clock in ───────────────────────────────────────────────────────────────

create or replace function public.clock_in(
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy double precision
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_office record;
  v_distance double precision;
begin
  v_user_id := public.current_app_user_id();
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  -- One attendance per day (BRD §3.1, §14).
  if exists (
    select 1 from public.attendance
    where user_id = v_user_id and work_date = current_date
  ) then
    raise exception 'ALREADY_CLOCKED_IN';
  end if;

  select o.latitude, o.longitude, o.allowed_radius
    into v_office
  from public.users u
  join public.office_locations o on o.id = u.office_location_id
  where u.id = v_user_id;
  if not found then
    raise exception 'NO_OFFICE';
  end if;

  v_distance := public.geo_distance_meters(
    p_latitude, p_longitude,
    v_office.latitude::double precision, v_office.longitude::double precision
  );
  if v_distance > v_office.allowed_radius then
    raise exception 'OUTSIDE_GEOFENCE';
  end if;

  insert into public.attendance (
    user_id, work_date, clock_in, status,
    clock_in_latitude, clock_in_longitude, clock_in_accuracy
  ) values (
    v_user_id, current_date, now(), 'working',
    p_latitude, p_longitude, p_accuracy
  );
exception
  when unique_violation then
    raise exception 'ALREADY_CLOCKED_IN';
end;
$$;

-- ── clock out ──────────────────────────────────────────────────────────────

create or replace function public.clock_out(
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy double precision
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

  return query select v_worked, v_extra, (v_base + v_bonus);
end;
$$;

-- ── missed clock out recovery ──────────────────────────────────────────────
-- The user submits the clock-out time they forgot; the record is finalized and
-- flagged is_edited (BRD §12, §19). Points are recomputed from scratch.

create or replace function public.recover_missed_clock_out(
  p_attendance_id uuid,
  p_clock_out timestamptz
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

  return query select v_worked, v_extra, (v_base + v_bonus);
end;
$$;

-- ── grants: authenticated only ─────────────────────────────────────────────

revoke all on function public.clock_in(double precision, double precision, double precision) from public;
revoke all on function public.clock_out(double precision, double precision, double precision) from public;
revoke all on function public.recover_missed_clock_out(uuid, timestamptz) from public;

grant execute on function public.clock_in(double precision, double precision, double precision) to authenticated;
grant execute on function public.clock_out(double precision, double precision, double precision) to authenticated;
grant execute on function public.recover_missed_clock_out(uuid, timestamptz) to authenticated;

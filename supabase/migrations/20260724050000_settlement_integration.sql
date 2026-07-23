-- ClockUp — Phase 4D: settlement integration (ADR-009).
--
-- Connects the redemption holds into the attendance engine. A single shared
-- SQL routine, settle_attendance_day, performs the whole ADR-009 settlement
-- (consume only what's needed, release the rest, compute Counted, award flat
-- points from Counted, award earned credits from Worked). clock_out and
-- recover_missed_clock_out both finalize the attendance row and then call it —
-- no duplicated business logic. Everything runs in ONE transaction (atomic,
-- all-or-nothing) and is idempotent per attendance.
--
-- Gated by p_enable_redemption (ENABLE_CREDIT_REDEMPTION). OFF ⇒ Applied is
-- always 0 ⇒ Counted = Worked ⇒ identical to Phase 4C.

-- ── idempotency backstop: at most one settlement 'used' row per attendance ────
-- (standalone consume_time_credit rows carry a null attendance_id and are
-- unaffected — nulls are distinct in a unique index.)
create unique index time_credit_used_once_per_attendance
  on public.time_credit_ledger (attendance_id)
  where entry_type = 'used';

-- ── shared settlement routine ─────────────────────────────────────────────────
create or replace function public.settle_attendance_day(
  p_attendance_id     uuid,
  p_user_id           uuid,
  p_worked_minutes    integer,
  p_award_credits     boolean,   -- ENABLE_TIME_CREDITS  (earning)
  p_enable_redemption boolean    -- ENABLE_CREDIT_REDEMPTION (consume holds)
)
returns integer                  -- points earned (flat, from Counted)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_min_work       integer;
  v_shortfall      integer;
  v_applied        integer := 0;
  v_counted        integer;
  v_points         integer;
  v_hold           public.time_credit_redemption;
  v_balance        bigint;
  v_reserved_other bigint;
  v_available      bigint;
begin
  -- ── 1. Redemption settlement (only when enabled) ──
  if p_enable_redemption then
    -- Serialize with concurrent redemption mutations for this user. Same lock
    -- key + ordering (advisory before any attendance lock) as the redemption
    -- RPCs, so no deadlock.
    perform pg_advisory_xact_lock(hashtext('credit_redemption:' || p_user_id::text)::bigint);

    select * into v_hold
    from public.time_credit_redemption
    where attendance_id = p_attendance_id and status = 'pending'
    for update;

    if found then
      -- Minimum physical work gate (configurable). Below it, nothing is applied.
      select min_work_minutes into v_min_work from public.credit_policy limit 1;
      if p_worked_minutes >= coalesce(v_min_work, 240) then
        v_shortfall := greatest(0, 540 - p_worked_minutes);
        v_balance := (
          select coalesce(sum(credits), 0)::bigint
          from public.time_credit_ledger where user_id = p_user_id
        );
        v_reserved_other := (
          select coalesce(sum(requested_credits), 0)::bigint
          from public.time_credit_redemption
          where user_id = p_user_id and status = 'pending'
            and attendance_id <> p_attendance_id
        );
        v_available := v_balance - v_reserved_other;
        -- Applied = min(Requested, Shortfall, Available), never negative.
        v_applied := greatest(0, least(
          v_hold.requested_credits,
          v_shortfall,
          greatest(0, v_available)::integer
        ));
      end if;

      if v_applied > 0 then
        insert into public.time_credit_ledger (user_id, attendance_id, entry_type, credits, reason)
        values (p_user_id, p_attendance_id, 'used', -v_applied, 'Redeemed toward daily goal')
        on conflict (attendance_id) where entry_type = 'used' do nothing;
        update public.time_credit_redemption
          set status = 'applied', applied_credits = v_applied, settled_at = now()
          where id = v_hold.id;
      else
        -- Nothing needed / below minimum: release the hold unused.
        update public.time_credit_redemption
          set status = 'released', applied_credits = 0, settled_at = now()
          where id = v_hold.id;
      end if;
    end if;
  end if;

  -- ── 2. Counted → flat points (recompute-safe) ──
  v_counted := p_worked_minutes + v_applied;
  v_points := public.calculate_daily_points(v_counted);

  delete from public.points_ledger where attendance_id = p_attendance_id;
  if v_points > 0 then
    insert into public.points_ledger (user_id, attendance_id, reason, points)
    values (p_user_id, p_attendance_id, 'Daily goal (9h)', v_points);
  end if;

  -- ── 3. Earned credits (from WORKED only; mutually exclusive with consume) ──
  if p_award_credits then
    perform public.award_time_credits(p_user_id, p_attendance_id, p_worked_minutes);
  end if;

  return coalesce(v_points, 0);
end;
$$;

-- Internal only: the attendance RPCs (and future admin RPCs) call it; clients cannot.
revoke all on function public.settle_attendance_day(uuid, uuid, integer, boolean, boolean) from public;

-- ── clock_out: finalize the row, then settle (adds p_enable_redemption) ───────
drop function if exists public.clock_out(double precision, double precision, double precision, boolean);

create function public.clock_out(
  p_latitude          double precision,
  p_longitude         double precision,
  p_accuracy          double precision,
  p_award_credits     boolean default false,
  p_enable_redemption boolean default false
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

  -- Lock ordering: advisory (redemption) BEFORE the attendance row lock.
  if p_enable_redemption then
    perform pg_advisory_xact_lock(hashtext('credit_redemption:' || v_user_id::text)::bigint);
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

  update public.attendance set
    clock_out = v_out,
    worked_minutes = v_worked,
    extra_minutes = v_extra,
    status = 'completed',
    clock_out_latitude = p_latitude,
    clock_out_longitude = p_longitude,
    clock_out_accuracy = p_accuracy
  where id = v_att.id;

  -- Shared settlement: redemption consume + Counted + flat points + earned credits.
  v_points := public.settle_attendance_day(
    v_att.id, v_user_id, v_worked, p_award_credits, p_enable_redemption
  );

  return query select v_worked, v_extra, v_points;
end;
$$;

revoke all on function public.clock_out(double precision, double precision, double precision, boolean, boolean) from public;
grant execute on function public.clock_out(double precision, double precision, double precision, boolean, boolean) to authenticated;

-- ── recover_missed_clock_out: identical settlement (adds p_enable_redemption) ──
drop function if exists public.recover_missed_clock_out(uuid, timestamptz, boolean);

create function public.recover_missed_clock_out(
  p_attendance_id     uuid,
  p_clock_out         timestamptz,
  p_award_credits     boolean default false,
  p_enable_redemption boolean default false
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

  if p_enable_redemption then
    perform pg_advisory_xact_lock(hashtext('credit_redemption:' || v_user_id::text)::bigint);
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

  update public.attendance set
    clock_out = p_clock_out,
    worked_minutes = v_worked,
    extra_minutes = v_extra,
    status = 'completed',
    is_edited = true
  where id = v_att.id;

  -- Exact same settlement as a normal clock-out (shared routine).
  v_points := public.settle_attendance_day(
    v_att.id, v_user_id, v_worked, p_award_credits, p_enable_redemption
  );

  return query select v_worked, v_extra, v_points;
end;
$$;

revoke all on function public.recover_missed_clock_out(uuid, timestamptz, boolean, boolean) from public;
grant execute on function public.recover_missed_clock_out(uuid, timestamptz, boolean, boolean) to authenticated;

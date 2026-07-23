-- ClockUp — Phase 4B: Time Credit Redemption INFRASTRUCTURE (ADR-009).
--
-- Builds the redemption "hold" subsystem so later phases can plug settlement in.
-- INFRASTRUCTURE ONLY: nothing here consumes credits, awards points, or touches
-- the attendance engine / clock_out / recover / earning / ledger movements. The
-- RPCs only create / update / cancel / read holds. The running app is unchanged
-- (nothing calls these yet; the service is gated by ENABLE_CREDIT_REDEMPTION).

-- ── configurable policy (MIN_WORK_MINUTES — never hardcoded inline) ────────────
-- Singleton row; HR can tune min_work_minutes at runtime without a deploy.
create table public.credit_policy (
  id               boolean primary key default true,
  min_work_minutes integer not null default 240,   -- 4h before credits may be redeemed
  updated_at       timestamptz not null default now(),
  constraint credit_policy_singleton check (id),
  constraint credit_policy_min_work_nonneg check (min_work_minutes >= 0)
);
insert into public.credit_policy (id) values (true);

alter table public.credit_policy enable row level security;
-- Global, non-sensitive config: any signed-in user may read it (for the future
-- redeem dialog); writes are admin-only (no write policy).
create policy credit_policy_read on public.credit_policy
  for select to authenticated using (true);
grant select on public.credit_policy to authenticated;

-- ── redemption lifecycle status ───────────────────────────────────────────────
create type public.redemption_status as enum (
  'pending',    -- reserved hold, not yet settled
  'applied',    -- settled at completion (Phase 4D) — some credits consumed
  'cancelled',  -- user cancelled before completion
  'released'    -- freed without consumption (never completed / not needed)
);

-- ── holds table ───────────────────────────────────────────────────────────────
create table public.time_credit_redemption (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users (id) on delete cascade,
  attendance_id     uuid not null references public.attendance (id) on delete cascade,
  requested_credits integer not null,          -- the hold ceiling
  applied_credits   integer,                    -- null until settled (Phase 4D)
  status            public.redemption_status not null default 'pending',
  created_at        timestamptz not null default now(),
  settled_at        timestamptz,                -- set on any terminal transition
  constraint tcr_requested_positive check (requested_credits > 0),
  constraint tcr_applied_nonneg check (applied_credits is null or applied_credits >= 0)
);

-- At most ONE active (pending) hold per attendance — the create/adjust anchor.
create unique index tcr_one_active_per_attendance
  on public.time_credit_redemption (attendance_id)
  where status = 'pending';

create index tcr_user_id_idx on public.time_credit_redemption (user_id);
create index tcr_attendance_id_idx on public.time_credit_redemption (attendance_id);

-- ── RLS: read own only; all writes via SECURITY DEFINER RPCs ───────────────────
alter table public.time_credit_redemption enable row level security;
create policy tcr_select_own on public.time_credit_redemption
  for select to authenticated
  using (user_id = public.current_app_user_id());
grant select on public.time_credit_redemption to authenticated;

-- ── extend the balance view (additive: reserved + available) ──────────────────
-- Existing columns (user_id, earned_credits, used_credits, current_balance) keep
-- their exact meaning; two trailing columns are appended. security_invoker keeps
-- every subquery RLS-scoped to the caller.
create or replace view public.v_time_credit_balance
with (security_invoker = on) as
select
  u.id                                                             as user_id,
  coalesce(sum(c.credits) filter (where c.credits > 0), 0)::bigint  as earned_credits,
  coalesce(-sum(c.credits) filter (where c.credits < 0), 0)::bigint as used_credits,
  coalesce(sum(c.credits), 0)::bigint                              as current_balance,
  coalesce((
    select sum(r.requested_credits)
    from public.time_credit_redemption r
    where r.user_id = u.id and r.status = 'pending'
  ), 0)::bigint                                                    as reserved_credits,
  (coalesce(sum(c.credits), 0) - coalesce((
    select sum(r.requested_credits)
    from public.time_credit_redemption r
    where r.user_id = u.id and r.status = 'pending'
  ), 0))::bigint                                                   as available_balance
from public.users u
left join public.time_credit_ledger c on c.user_id = u.id
group by u.id;

grant select on public.v_time_credit_balance to authenticated;

-- ── RPCs (SECURITY DEFINER; identity from current_app_user_id) ────────────────
-- These manage HOLDS only. No ledger writes, no points, no settlement.

-- Create or adjust the caller's pending hold for TODAY's open attendance.
-- Validates: auth, positive amount, an open ('working') day, the configurable
-- minimum worked minutes, a current shortfall, and available balance. Serialized
-- per user so concurrent create/cancel can't race the available-balance check.
create or replace function public.create_or_update_redemption(p_requested_credits integer)
returns table (redemption_id uuid, requested_credits integer, available_balance bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user           uuid;
  v_att            public.attendance;
  v_min_work       integer;
  v_worked         integer;
  v_shortfall      integer;
  v_balance        bigint;
  v_reserved_other bigint;
  v_available      bigint;
  v_id             uuid;
begin
  v_user := public.current_app_user_id();
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_requested_credits is null or p_requested_credits <= 0 then
    raise exception 'INVALID_CREDITS';
  end if;

  -- Serialize this user's redemption mutations (held to end-of-transaction).
  perform pg_advisory_xact_lock(hashtext('credit_redemption:' || v_user::text)::bigint);

  select * into v_att
  from public.attendance
  where user_id = v_user and work_date = current_date
  for update;
  if not found then raise exception 'NO_ATTENDANCE'; end if;
  if v_att.status <> 'working' then raise exception 'DAY_NOT_OPEN'; end if;

  select min_work_minutes into v_min_work from public.credit_policy limit 1;
  v_worked := greatest(0, floor(extract(epoch from (now() - v_att.clock_in)) / 60)::int);
  if v_worked < coalesce(v_min_work, 240) then raise exception 'MIN_WORK_NOT_MET'; end if;

  v_shortfall := greatest(0, 540 - v_worked);
  if v_shortfall <= 0 then raise exception 'NO_SHORTFALL'; end if;

  v_balance := (
    select coalesce(sum(credits), 0)::bigint
    from public.time_credit_ledger where user_id = v_user
  );
  -- Reserved by OTHER attendances' pending holds (so updating this one is clean).
  v_reserved_other := (
    select coalesce(sum(requested_credits), 0)::bigint
    from public.time_credit_redemption
    where user_id = v_user and status = 'pending' and attendance_id <> v_att.id
  );
  v_available := v_balance - v_reserved_other;

  if p_requested_credits > v_shortfall then raise exception 'REQUEST_EXCEEDS_SHORTFALL'; end if;
  if p_requested_credits > v_available then raise exception 'INSUFFICIENT_CREDITS'; end if;

  insert into public.time_credit_redemption (user_id, attendance_id, requested_credits, status)
  values (v_user, v_att.id, p_requested_credits, 'pending')
  on conflict (attendance_id) where status = 'pending'
  do update set requested_credits = excluded.requested_credits
  returning id into v_id;

  return query select v_id, p_requested_credits, (v_available - p_requested_credits)::bigint;
end;
$$;

revoke all on function public.create_or_update_redemption(integer) from public;
grant execute on function public.create_or_update_redemption(integer) to authenticated;

-- Cancel the caller's pending hold for today's attendance. Releases the hold; no
-- ledger movement. Returns the caller's available balance.
create or replace function public.cancel_redemption()
returns table (available_balance bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user     uuid;
  v_att      public.attendance;
  v_balance  bigint;
  v_reserved bigint;
begin
  v_user := public.current_app_user_id();
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;

  perform pg_advisory_xact_lock(hashtext('credit_redemption:' || v_user::text)::bigint);

  select * into v_att
  from public.attendance
  where user_id = v_user and work_date = current_date;
  if not found then raise exception 'NO_ATTENDANCE'; end if;

  update public.time_credit_redemption
    set status = 'cancelled', settled_at = now()
    where user_id = v_user and attendance_id = v_att.id and status = 'pending';
  if not found then raise exception 'NO_ACTIVE_REDEMPTION'; end if;

  v_balance := (
    select coalesce(sum(credits), 0)::bigint
    from public.time_credit_ledger where user_id = v_user
  );
  v_reserved := (
    select coalesce(sum(requested_credits), 0)::bigint
    from public.time_credit_redemption
    where user_id = v_user and status = 'pending'
  );
  return query select (v_balance - v_reserved)::bigint;
end;
$$;

revoke all on function public.cancel_redemption() from public;
grant execute on function public.cancel_redemption() to authenticated;

-- Read the caller's redemption for today's attendance (most recent), if any.
create or replace function public.get_today_redemption()
returns table (
  id uuid,
  attendance_id uuid,
  requested_credits integer,
  applied_credits integer,
  status public.redemption_status,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_user uuid;
begin
  v_user := public.current_app_user_id();
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  return query
    select r.id, r.attendance_id, r.requested_credits, r.applied_credits, r.status, r.created_at
    from public.time_credit_redemption r
    join public.attendance a on a.id = r.attendance_id
    where r.user_id = v_user and a.work_date = current_date
    order by r.created_at desc
    limit 1;
end;
$$;

revoke all on function public.get_today_redemption() from public;
grant execute on function public.get_today_redemption() to authenticated;

-- ClockUp — Time Credits ledger (Phase 2 infrastructure). See docs/adr/ADR-008.
--
-- A dedicated, append-only ledger for Time Credits, kept entirely separate from
-- points_ledger so the frozen v1.0 scoring (leaderboard / dashboard / stats) is
-- never affected. It reuses the exact patterns already proven in this schema:
--   • append-only ledger with a signed integer amount
--   • RLS: employees read only their OWN rows; writes only via SECURITY DEFINER
--   • a security_invoker balance VIEW (balances are derived, never stored)
--   • SECURITY DEFINER RPCs that derive identity from current_app_user_id()
--
-- PHASE 2 IS INFRASTRUCTURE ONLY: this migration inserts no rows, and nothing in
-- the running application calls these objects yet (no earning at clock-out, no
-- consumption). Attendance, points, and required hours are unchanged.

-- ── entry type ────────────────────────────────────────────────────────────────
create type public.credit_entry_type as enum (
  'earned',            -- + granted for working past the goal (Phase 3)
  'used',              -- − spent to reduce required hours (redemption)
  'manual_adjustment', -- ± HR / admin correction
  'expired',           -- − lapsed credits
  'bonus'              -- + discretionary award
);

-- ── ledger table ──────────────────────────────────────────────────────────────
create table public.time_credit_ledger (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  -- nullable link to the source day; ON DELETE SET NULL preserves the credit
  -- history (immutable accounting) even if an attendance row is ever removed.
  attendance_id uuid references public.attendance (id) on delete set null,
  entry_type    public.credit_entry_type not null,
  credits       integer not null,  -- signed: positive = earned, negative = used
  reason        text not null,
  created_at    timestamptz not null default now(),
  constraint time_credit_credits_nonzero check (credits <> 0),
  -- Sign must agree with the entry type (tamper-proof accounting).
  constraint time_credit_sign_ck check (
    case entry_type
      when 'earned'  then credits > 0
      when 'bonus'   then credits > 0
      when 'used'    then credits < 0
      when 'expired' then credits < 0
      else true                    -- manual_adjustment may be either sign
    end
  )
);

create index time_credit_ledger_user_id_idx on public.time_credit_ledger (user_id);
create index time_credit_ledger_created_at_idx on public.time_credit_ledger (created_at);
create index time_credit_ledger_attendance_id_idx on public.time_credit_ledger (attendance_id);

-- ── RLS (the exact model used by points_ledger) ───────────────────────────────
alter table public.time_credit_ledger enable row level security;

-- Read own rows only. There is deliberately NO insert/update/delete policy, so
-- clients can never write; the SECURITY DEFINER RPCs below are the only writers.
create policy time_credit_ledger_select_own
  on public.time_credit_ledger for select
  to authenticated
  using (user_id = public.current_app_user_id());

grant select on public.time_credit_ledger to authenticated;

-- ── balance view (never store balances) ───────────────────────────────────────
-- security_invoker = on → the caller's RLS applies, so a user only ever sees
-- their OWN balance row (mirrors v_user_stats).
create view public.v_time_credit_balance
with (security_invoker = on) as
select
  u.id                                                             as user_id,
  coalesce(sum(c.credits) filter (where c.credits > 0), 0)::bigint  as earned_credits,
  coalesce(-sum(c.credits) filter (where c.credits < 0), 0)::bigint as used_credits,
  coalesce(sum(c.credits), 0)::bigint                              as current_balance
from public.users u
left join public.time_credit_ledger c on c.user_id = u.id
group by u.id;

grant select on public.v_time_credit_balance to authenticated;

-- ── RPCs (SECURITY DEFINER; identity derived server-side) ─────────────────────

-- Caller's own balance (earned / used / net). Read-only.
create or replace function public.get_time_credit_balance()
returns table (earned_credits bigint, used_credits bigint, current_balance bigint)
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
    select
      coalesce(sum(c.credits) filter (where c.credits > 0), 0)::bigint,
      coalesce(-sum(c.credits) filter (where c.credits < 0), 0)::bigint,
      coalesce(sum(c.credits), 0)::bigint
    from public.time_credit_ledger c
    where c.user_id = v_user;
end;
$$;

grant execute on function public.get_time_credit_balance() to authenticated;

-- Grant credits to the caller (positive entries only). Returns the new balance.
create or replace function public.add_time_credit(
  p_credits       integer,
  p_entry_type    public.credit_entry_type,
  p_reason        text,
  p_attendance_id uuid default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  v_user := public.current_app_user_id();
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_credits is null or p_credits <= 0 then raise exception 'INVALID_CREDITS'; end if;
  if p_reason is null or length(btrim(p_reason)) = 0 then raise exception 'INVALID_REASON'; end if;
  if p_entry_type not in ('earned', 'bonus', 'manual_adjustment') then
    raise exception 'INVALID_ENTRY_TYPE';  -- consumption / expiry use their own paths
  end if;

  insert into public.time_credit_ledger (user_id, attendance_id, entry_type, credits, reason)
  values (v_user, p_attendance_id, p_entry_type, p_credits, btrim(p_reason));

  return (
    select coalesce(sum(credits), 0)::bigint
    from public.time_credit_ledger where user_id = v_user
  );
end;
$$;

grant execute on function public.add_time_credit(integer, public.credit_entry_type, text, uuid) to authenticated;

-- Consume credits from the caller's balance. SAFE BY DESIGN: it validates that a
-- sufficient balance exists and serializes concurrent consumes per user with a
-- transaction advisory lock, so the balance check and the insert are atomic —
-- the balance can never go negative. Returns the new balance, or raises
-- INSUFFICIENT_CREDITS. (An append-only ledger has no single row to FOR UPDATE,
-- hence the advisory lock rather than row locking.)
create or replace function public.consume_time_credit(
  p_credits integer,
  p_reason  text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user    uuid;
  v_balance bigint;
begin
  v_user := public.current_app_user_id();
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_credits is null or p_credits <= 0 then raise exception 'INVALID_CREDITS'; end if;
  if p_reason is null or length(btrim(p_reason)) = 0 then raise exception 'INVALID_REASON'; end if;

  -- Serialize concurrent consumes for THIS user; held to end-of-transaction.
  perform pg_advisory_xact_lock(hashtext('time_credit:' || v_user::text)::bigint);

  select coalesce(sum(credits), 0)::bigint into v_balance
  from public.time_credit_ledger where user_id = v_user;

  if v_balance < p_credits then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  insert into public.time_credit_ledger (user_id, attendance_id, entry_type, credits, reason)
  values (v_user, null, 'used', -p_credits, btrim(p_reason));

  return v_balance - p_credits;
end;
$$;

grant execute on function public.consume_time_credit(integer, text) to authenticated;

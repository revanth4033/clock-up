-- ClockUp — Phase 4B fix: resolve a PL/pgSQL name ambiguity in
-- create_or_update_redemption (20260724020000). The function's RETURNS TABLE
-- output column `requested_credits` collided with the `requested_credits` table
-- column inside `sum(requested_credits)`, raising "column reference ... is
-- ambiguous" on every call. `#variable_conflict use_column` makes bare
-- references resolve to the table column (the function returns positionally, so
-- it never needs the OUT variables by name). Behaviour is otherwise identical.

create or replace function public.create_or_update_redemption(p_requested_credits integer)
returns table (redemption_id uuid, requested_credits integer, available_balance bigint)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
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

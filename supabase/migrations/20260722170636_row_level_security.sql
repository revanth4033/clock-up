-- ClockUp — Row Level Security (DDD "Row Level Security" + BRD §20).
--
-- auth.uid() is the Supabase auth user id, which maps to
-- public.users.password_auth_id. The helper below resolves it to the app user
-- id (public.users.id) that every other table references as user_id.
-- It is SECURITY DEFINER so it can read public.users without tripping that
-- table's own RLS (which would otherwise recurse).

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where password_auth_id = auth.uid()
$$;

grant execute on function public.current_app_user_id() to authenticated;

-- Enable RLS on every table.
alter table public.office_locations enable row level security;
alter table public.users            enable row level security;
alter table public.attendance       enable row level security;
alter table public.points_ledger    enable row level security;
alter table public.notifications    enable row level security;
alter table public.user_settings    enable row level security;
alter table public.holidays         enable row level security;

-- Office Locations — readable by everyone (the registration form needs the list
-- before a user is authenticated). No client writes (seed/admin managed).
create policy office_locations_select_all
  on public.office_locations for select
  using (true);

-- Holidays — readable by any signed-in user. No client writes (future/admin).
create policy holidays_select_authenticated
  on public.holidays for select
  to authenticated
  using (true);

-- Users — read / create / update ONLY your own profile row. No delete policy,
-- so deletes are denied. Other users' public data is exposed only through
-- v_leaderboard (name / avatar / points), never through this base table.
create policy users_select_own
  on public.users for select
  to authenticated
  using (password_auth_id = auth.uid());

create policy users_insert_own
  on public.users for insert
  to authenticated
  with check (password_auth_id = auth.uid());

create policy users_update_own
  on public.users for update
  to authenticated
  using (password_auth_id = auth.uid())
  with check (password_auth_id = auth.uid());

-- Attendance — read + insert own; update own only while NOT completed.
-- BRD §19: completed attendance is immutable; the only edit is Missed Clock Out
-- recovery (which acts on a 'missed_clock_out' row). No delete policy → denied.
create policy attendance_select_own
  on public.attendance for select
  to authenticated
  using (user_id = public.current_app_user_id());

create policy attendance_insert_own
  on public.attendance for insert
  to authenticated
  with check (user_id = public.current_app_user_id());

create policy attendance_update_own_not_completed
  on public.attendance for update
  to authenticated
  using (user_id = public.current_app_user_id() and status <> 'completed')
  with check (user_id = public.current_app_user_id());

-- Points Ledger — read own only. Awards are written server-side (service role);
-- clients can never insert/update/delete points (DDD: "Read only").
create policy points_ledger_select_own
  on public.points_ledger for select
  to authenticated
  using (user_id = public.current_app_user_id());

-- Notifications — read + mark-read (update) own only. Creation is server-side.
create policy notifications_select_own
  on public.notifications for select
  to authenticated
  using (user_id = public.current_app_user_id());

create policy notifications_update_own
  on public.notifications for update
  to authenticated
  using (user_id = public.current_app_user_id())
  with check (user_id = public.current_app_user_id());

-- User Settings — read / create / update own only.
create policy user_settings_select_own
  on public.user_settings for select
  to authenticated
  using (user_id = public.current_app_user_id());

create policy user_settings_insert_own
  on public.user_settings for insert
  to authenticated
  with check (user_id = public.current_app_user_id());

create policy user_settings_update_own
  on public.user_settings for update
  to authenticated
  using (user_id = public.current_app_user_id())
  with check (user_id = public.current_app_user_id());

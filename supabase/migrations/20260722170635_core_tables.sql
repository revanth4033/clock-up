-- ClockUp — core tables (DDD).
-- All timestamps are timestamptz (UTC) so working time is always computed from
-- trustworthy server time, never the client clock (BRD §5, §10).

-- Auto-maintain updated_at on row updates.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 1. Office Locations — geofence reference for Clock In / Clock Out (BRD §11).
create table public.office_locations (
  id             uuid primary key default gen_random_uuid(),
  office_name    text not null unique,
  latitude       decimal(9, 6) not null,
  longitude      decimal(9, 6) not null,
  allowed_radius integer not null default 100, -- metres (BRD: e.g. 100m)
  created_at     timestamptz not null default now()
);

-- 2. Users — employee profiles. Passwords/credentials live in Supabase
--    auth.users; password_auth_id links this profile to that auth identity.
create table public.users (
  id                 uuid primary key default gen_random_uuid(),
  password_auth_id   uuid not null unique references auth.users (id) on delete cascade,
  employee_id        text not null unique,             -- immutable after creation (BRD §1.3)
  full_name          text not null,
  office_email       text not null unique,
  designation        text not null,
  office_location_id uuid not null references public.office_locations (id) on delete restrict,
  avatar_url         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index users_office_location_id_idx on public.users (office_location_id);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- 3. Attendance — exactly one work session per user per day (BRD §2, §14).
--    points_earned is intentionally omitted: points_ledger is the single source
--    of truth (approved decision). A day's points = sum of its ledger rows.
create table public.attendance (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users (id) on delete cascade,
  work_date           date not null,
  clock_in            timestamptz not null,          -- a row exists only after Clock In
  clock_out           timestamptz,                   -- null while Working / Missed Clock Out
  worked_minutes      integer,                       -- computed at Clock Out (BRD §5)
  extra_minutes       integer,                       -- overtime minutes past the 9h goal
  status              public.attendance_status not null default 'working',
  clock_in_latitude   decimal(9, 6),
  clock_in_longitude  decimal(9, 6),
  clock_out_latitude  decimal(9, 6),
  clock_out_longitude decimal(9, 6),
  clock_in_accuracy   real,
  clock_out_accuracy  real,
  is_edited           boolean not null default false, -- true after Missed Clock Out recovery (BRD §12, §19)
  created_at          timestamptz not null default now(),
  constraint attendance_one_per_day unique (user_id, work_date)
);

create index attendance_user_id_idx on public.attendance (user_id);
create index attendance_work_date_idx on public.attendance (work_date);

-- 4. Points Ledger — append-only accounting of every point award (DDD).
--    attendance_id is null for future non-attendance awards (badges, bonuses).
create table public.points_ledger (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  attendance_id uuid references public.attendance (id) on delete cascade,
  reason        text not null,   -- e.g. 'Daily Goal', 'Overtime +15m'
  points        integer not null,
  created_at    timestamptz not null default now()
);

create index points_ledger_user_id_idx on public.points_ledger (user_id);
create index points_ledger_attendance_id_idx on public.points_ledger (attendance_id);
create index points_ledger_created_at_idx on public.points_ledger (created_at);

-- 5. Notifications — per-user alerts (BRD §21).
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  title      text not null,
  body       text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);

-- 6. User Settings — exactly one row per user (theme, notifications).
create table public.user_settings (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references public.users (id) on delete cascade,
  theme                 public.theme not null default 'system',
  notifications_enabled boolean not null default true,
  created_at            timestamptz not null default now()
);

-- 7. Holidays — future support (BRD §16). Dates needing no attendance.
--    office_location_id null = company-wide; set = office-specific.
create table public.holidays (
  id                 uuid primary key default gen_random_uuid(),
  office_location_id uuid references public.office_locations (id) on delete cascade,
  holiday_date       date not null,
  name               text not null,
  created_at         timestamptz not null default now(),
  constraint holidays_unique_per_office unique (office_location_id, holiday_date)
);

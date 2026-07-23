-- ============================================================================
-- ClockUp — QA SEED DATA  (supabase/seed/qa_seed.sql)
-- ============================================================================
-- Realistic dummy data for QA / demo: 18 employees, ~6 weeks of attendance,
-- and a points ledger consistent with the real business rules.
--
-- WHAT IT CREATES
--   • 18 auth users (@clockup.test) — shared password below. Inserting into
--     auth.users fires the app's on_auth_user_created trigger, which creates the
--     matching public.users + public.user_settings rows automatically (so this
--     seed never touches app code or duplicates the trigger's work).
--   • ~30 working days of attendance per user (weekends skipped), with a mix of
--     completed days, a few missed-clock-outs, some absences, and some people
--     currently "working" today.
--   • points_ledger rows using the SAME formula and reason strings as the
--     clock_out RPC: 100 at the 9h goal, +10 per extra 15 min, bonus capped at
--     40 (max 140/day). Points are only ever written here, never on attendance.
--
-- SHARED LOGIN PASSWORD for every seeded account:   Clockup123
-- (e.g. sign in as  aarav.sharma@clockup.test / Clockup123)
--
-- SAFETY / NOTES
--   • Run as the Supabase "postgres" role (the SQL Editor does this), which may
--     write auth.* and bypasses RLS — that is expected and required for a seed.
--   • Idempotent: re-running skips any @clockup.test user that already exists,
--     so it will not create duplicate attendance/points.
--   • Reversible: an UNDO block is provided (commented out) at the very bottom.
--   • Requires the migrations to be applied first (needs a seeded office row and
--     the handle_new_user trigger). If no office exists the script aborts with a
--     clear message.
--   • Deterministic: variation is derived from a hash of (employee_id, date), so
--     re-seeding a fresh DB yields the same data.
-- ============================================================================

do $$
declare
  v_office_id   uuid;
  v_office_lat  numeric;
  v_office_lng  numeric;
  v_pwd         text := 'Clockup123';

  v_emp         record;
  v_auth_id     uuid;
  v_user_id     uuid;
  v_created     timestamptz;

  d             int;
  wdate         date;
  h             bigint;         -- deterministic per (employee, day) hash
  r             int;
  worked        int;
  extra         int;
  base          int;
  bonus         int;
  cin           timestamptz;
  cout          timestamptz;
  lat           numeric;
  lng           numeric;
  acc           real;
  v_state       text;
  v_att_id      uuid;

  n_users       int := 0;
  n_att         int := 0;
  n_points      int := 0;
begin
  -- Anchor everything to the first office (the geofence reference).
  select id, latitude, longitude
    into v_office_id, v_office_lat, v_office_lng
  from public.office_locations
  order by created_at, office_name
  limit 1;

  if v_office_id is null then
    raise exception 'No office_locations row found. Apply the migrations (which seed the default office) before running this seed.';
  end if;

  -- ── Employees ────────────────────────────────────────────────────────────
  -- Columns: full_name, employee_id, email, designation, tier (1=top perf …
  -- 3=lower, drives worked-minutes / points spread), created_days_ago.
  for v_emp in
    select * from (values
      ('Aarav Sharma',   'CLK-1001', 'aarav.sharma@clockup.test',    'Engineering Lead',          1, 168),
      ('Diya Patel',     'CLK-1002', 'diya.patel@clockup.test',      'Senior Product Designer',   1, 154),
      ('Vivaan Reddy',   'CLK-1003', 'vivaan.reddy@clockup.test',    'Senior Software Engineer',  1, 149),
      ('Ananya Iyer',    'CLK-1004', 'ananya.iyer@clockup.test',     'Senior Data Analyst',       1, 132),
      ('Kabir Nair',     'CLK-1005', 'kabir.nair@clockup.test',      'Software Engineer',         2, 121),
      ('Ishaan Gupta',   'CLK-1006', 'ishaan.gupta@clockup.test',    'Software Engineer',         2, 118),
      ('Meera Krishnan', 'CLK-1007', 'meera.krishnan@clockup.test',  'QA Engineer',               2, 110),
      ('Rohan Mehta',    'CLK-1008', 'rohan.mehta@clockup.test',     'DevOps Engineer',           2,  98),
      ('Saanvi Rao',     'CLK-1009', 'saanvi.rao@clockup.test',      'Product Manager',           2,  92),
      ('Arjun Singh',    'CLK-1010', 'arjun.singh@clockup.test',     'Backend Engineer',          2,  84),
      ('Priya Menon',    'CLK-1011', 'priya.menon@clockup.test',     'UX Researcher',             2,  76),
      ('Aditya Kumar',   'CLK-1012', 'aditya.kumar@clockup.test',    'Frontend Engineer',         2,  70),
      ('Nisha Verma',    'CLK-1013', 'nisha.verma@clockup.test',     'QA Engineer',               3,  63),
      ('Karan Malhotra', 'CLK-1014', 'karan.malhotra@clockup.test',  'Software Engineer',         3,  57),
      ('Riya Desai',     'CLK-1015', 'riya.desai@clockup.test',      'Marketing Analyst',         3,  49),
      ('Dev Joshi',      'CLK-1016', 'dev.joshi@clockup.test',       'Support Engineer',          3,  41),
      ('Tara Pillai',    'CLK-1017', 'tara.pillai@clockup.test',     'HR Associate',              3,  35),
      ('Neil DSouza',    'CLK-1018', 'neil.dsouza@clockup.test',     'Software Engineer',         3,  30)
    ) as t(full_name, employee_id, email, designation, tier, created_days_ago)
  loop
    -- Idempotency: skip if this QA user already exists.
    if exists (select 1 from auth.users where email = v_emp.email) then
      continue;
    end if;

    v_auth_id := gen_random_uuid();
    v_created := now() - make_interval(days => v_emp.created_days_ago);

    -- Create the auth identity. The on_auth_user_created trigger reads this
    -- metadata to build the public.users + public.user_settings rows.
    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_auth_id, 'authenticated', 'authenticated', v_emp.email,
      extensions.crypt(v_pwd, extensions.gen_salt('bf')),
      v_created,
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'full_name',          v_emp.full_name,
        'employee_id',        v_emp.employee_id,
        'designation',        v_emp.designation,
        'office_location_id', v_office_id::text
      ),
      v_created, v_created,
      '', '', '', ''
    );

    -- Password-login identity. Wrapped so a GoTrue-version schema difference
    -- degrades gracefully (profile + data still seed; only login is affected).
    begin
      insert into auth.identities (
        provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        v_auth_id::text, v_auth_id,
        jsonb_build_object(
          'sub', v_auth_id::text, 'email', v_emp.email,
          'email_verified', true, 'phone_verified', false
        ),
        'email', v_created, v_created, v_created
      );
    exception when others then
      raise notice 'Skipped identity for % (login may be unavailable): %', v_emp.email, sqlerrm;
    end;

    -- Resolve the profile the trigger just created.
    select id into v_user_id from public.users where password_auth_id = v_auth_id;
    if v_user_id is null then
      raise notice 'Profile not created for % — skipping attendance.', v_emp.email;
      continue;
    end if;
    n_users := n_users + 1;

    -- A little theme variety (settings row already exists from the trigger).
    update public.user_settings
       set theme = case (abs(hashtext(v_emp.employee_id)) % 3)
                     when 0 then 'dark'::public.theme
                     when 1 then 'light'::public.theme
                     else 'system'::public.theme end
     where user_id = v_user_id;

    -- ── Attendance history: last 45 calendar days (weekends skipped) ────────
    for d in 0..44 loop
      wdate := current_date - d;
      if extract(isodow from wdate) >= 6 then
        continue;  -- Sat/Sun: no work
      end if;

      h := abs(hashtext(v_emp.employee_id || ':' || wdate::text));
      r := (h % 100)::int;

      -- Decide the day's state.
      if d = 0 then
        -- Today: about half are currently working, the rest haven't started.
        if (h % 10) < 5 then v_state := 'working'; else continue; end if;
      else
        if r < 8 then
          continue;                     -- ~8% absent (no row)
        elsif r < 12 then
          v_state := 'missed';          -- ~4% forgot to clock out
        else
          v_state := 'completed';
        end if;
      end if;

      -- Clock-in ~09:00–09:29 (stored as UTC, matching the app).
      cin := ((wdate::timestamp + interval '9 hours'
               + make_interval(mins => (h % 30)::int)) at time zone 'UTC');

      -- Coordinates near the office (small jitter, well inside the geofence).
      lat := v_office_lat + (((h % 11)::int - 5) * 0.00003);
      lng := v_office_lng + ((((h / 7) % 11)::int - 5) * 0.00003);
      acc := 6 + (h % 12)::int;

      if v_state = 'working' then
        insert into public.attendance (
          user_id, work_date, clock_in, status,
          clock_in_latitude, clock_in_longitude, clock_in_accuracy, created_at
        ) values (
          v_user_id, wdate, cin, 'working',
          lat, lng, acc, cin
        );
        n_att := n_att + 1;

      elsif v_state = 'missed' then
        insert into public.attendance (
          user_id, work_date, clock_in, status,
          clock_in_latitude, clock_in_longitude, clock_in_accuracy, created_at
        ) values (
          v_user_id, wdate, cin, 'missed_clock_out',
          lat, lng, acc, cin
        );
        n_att := n_att + 1;

      else -- completed
        -- Worked minutes by performance tier (some days fall short of the goal).
        worked := case v_emp.tier
                    when 1 then 560 + (h % 60)::int   -- 560..619 (often overtime)
                    when 2 then 530 + (h % 60)::int   -- 530..589 (around the goal)
                    else        500 + (h % 65)::int   -- 500..564 (sometimes short)
                  end;
        extra := greatest(0, worked - 540);
        cout  := cin + make_interval(mins => worked);

        -- Points — identical to public.points_for_minutes / the clock_out RPC.
        base  := case when worked >= 540 then 100 else 0 end;
        bonus := case when worked >= 540
                      then least((floor((worked - 540) / 15.0))::int * 10, 40)
                      else 0 end;

        insert into public.attendance (
          user_id, work_date, clock_in, clock_out,
          worked_minutes, extra_minutes, status,
          clock_in_latitude, clock_in_longitude, clock_in_accuracy,
          clock_out_latitude, clock_out_longitude, clock_out_accuracy,
          created_at
        ) values (
          v_user_id, wdate, cin, cout,
          worked, extra, 'completed',
          lat, lng, acc,
          lat, lng, acc,
          cout
        )
        returning id into v_att_id;
        n_att := n_att + 1;

        if base > 0 then
          insert into public.points_ledger (user_id, attendance_id, reason, points, created_at)
          values (v_user_id, v_att_id, 'Daily goal (9h)', base, cout);
          n_points := n_points + 1;
        end if;
        if bonus > 0 then
          insert into public.points_ledger (user_id, attendance_id, reason, points, created_at)
          values (v_user_id, v_att_id, 'Overtime bonus', bonus, cout);
          n_points := n_points + 1;
        end if;
      end if;
    end loop;  -- days
  end loop;    -- employees

  raise notice 'ClockUp QA seed complete: % new users, % attendance rows, % points rows.',
    n_users, n_att, n_points;
end $$;

-- ── Verify the result (these SELECTs just show what was seeded) ─────────────

-- Leaderboard (all-time), highest points first:
select
  u.full_name,
  u.employee_id,
  u.designation,
  coalesce(sum(p.points), 0)                              as total_points,
  count(distinct a.id) filter (where a.status = 'completed') as completed_days
from public.users u
left join public.points_ledger p on p.user_id = u.id
left join public.attendance    a on a.user_id = u.id
where u.office_email like '%@clockup.test'
group by u.id, u.full_name, u.employee_id, u.designation
order by total_points desc;

-- Row counts for the seeded QA accounts:
select
  (select count(*) from public.users        where office_email like '%@clockup.test')                              as qa_users,
  (select count(*) from public.attendance    a join public.users u on u.id = a.user_id where u.office_email like '%@clockup.test') as qa_attendance_rows,
  (select count(*) from public.points_ledger p join public.users u on u.id = p.user_id where u.office_email like '%@clockup.test') as qa_points_rows;

-- ============================================================================
-- UNDO (optional) — removes ONLY this QA seed. Deleting the auth users cascades
-- to public.users → attendance → points_ledger → user_settings. Uncomment to run:
--
-- delete from auth.users where email like '%@clockup.test';
-- ============================================================================

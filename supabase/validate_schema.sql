-- ClockUp — database schema validation.
-- Run in the Supabase dashboard SQL Editor (runs as the postgres role) AFTER
-- `supabase db push`. Returns one table: ord | section | item | result.
-- Every row should read "PASS ✓" (foreign_keys / indexes / rls_policies rows
-- are enumerations of what exists — eyeball that the counts below are present).
--
-- Expected: 7 tables · 2 enums · 8 foreign keys · 7 named indexes (+ PK/unique)
--           · 7 RLS-enabled tables · 14 policies · 3 views · 2 functions · 1 seed row.

with
expected_tables(name) as (
  values ('office_locations'),('users'),('attendance'),('points_ledger'),
         ('notifications'),('user_settings'),('holidays')
),
expected_enums(name, labels) as (
  values
    ('attendance_status', array['working','completed','missed_clock_out','incomplete']),
    ('theme', array['light','dark','system'])
),
expected_views(name) as (
  values ('v_user_stats'),('v_week_summary'),('v_leaderboard')
),
our_tables(name) as (
  values ('office_locations'),('users'),('attendance'),('points_ledger'),
         ('notifications'),('user_settings'),('holidays')
),
report as (
  -- 1. Tables
  select 1 ord, 'tables' section, e.name item,
    case when t.tablename is not null then 'PASS ✓' else 'FAIL ✗ MISSING' end result
  from expected_tables e
  left join pg_tables t on t.schemaname='public' and t.tablename=e.name

  union all
  -- 2. Enums (name + exact label set/order)
  select 2, 'enums', e.name,
    case
      when t.typname is null then 'FAIL ✗ MISSING'
      when act.labels = e.labels then 'PASS ✓ ('||array_to_string(act.labels,', ')||')'
      else 'WARN labels: '||array_to_string(act.labels,', ')
    end
  from expected_enums e
  left join pg_type t on t.typname=e.name and t.typnamespace='public'::regnamespace
  left join lateral (
    select array_agg(enumlabel::text order by enumsortorder) labels
    from pg_enum where enumtypid=t.oid
  ) act on true

  union all
  -- 3. Foreign keys (each found FK: table.column → referenced table)
  select 3, 'foreign_keys',
    con.conrelid::regclass::text || '.' ||
      (select string_agg(a.attname, ',')
       from pg_attribute a
       where a.attrelid=con.conrelid and a.attnum = any(con.conkey)),
    'PASS ✓ → '|| con.confrelid::regclass::text
  from pg_constraint con
  where con.contype='f' and con.connamespace='public'::regnamespace

  union all
  -- 4. Indexes on our tables (PK / unique / named)
  select 4, 'indexes', i.indexname, 'PASS ✓ on '||i.tablename
  from pg_indexes i
  where i.schemaname='public' and i.tablename in (select name from our_tables)

  union all
  -- 5. RLS enabled per table
  select 5, 'rls_enabled', c.relname,
    case when c.relrowsecurity then 'PASS ✓' else 'FAIL ✗ RLS OFF' end
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname in (select name from our_tables)

  union all
  -- 6. RLS policies (each: table · policy [command])
  select 6, 'rls_policies', p.tablename||' · '||p.policyname||' ['||p.cmd||']', 'PASS ✓'
  from pg_policies p
  where p.schemaname='public'

  union all
  -- 7. Views exist + actually execute (row count proves the SQL runs)
  select 7, 'views', v.name,
    case
      when not exists (select 1 from pg_views where schemaname='public' and viewname=v.name)
        then 'FAIL ✗ MISSING'
      when v.name='v_user_stats'   then 'PASS ✓ executes, rows='||(select count(*) from public.v_user_stats)::text
      when v.name='v_week_summary' then 'PASS ✓ executes, rows='||(select count(*) from public.v_week_summary)::text
      when v.name='v_leaderboard'  then 'PASS ✓ executes, rows='||(select count(*) from public.v_leaderboard)::text
    end
  from expected_views v

  union all
  -- 8. Helper functions
  select 8, 'functions', p.proname, 'PASS ✓'
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('current_app_user_id','set_updated_at')

  union all
  -- 9. Seed data
  select 9, 'seed', 'office_locations: Hyderabad HQ',
    case when exists (select 1 from public.office_locations where office_name='Hyderabad HQ')
      then 'PASS ✓ present' else 'FAIL ✗ MISSING' end
)
select ord, section, item, result
from report
order by ord, section, item;

-- ClockUp — auto-provision the profile on signup (single source of truth).
--
-- When an auth user is created, this trigger atomically creates the matching
-- public.users row and its default public.user_settings row from the signup
-- metadata (raw_user_meta_data). It runs INSIDE GoTrue's signup transaction, so
-- any failure — duplicate employee_id, missing/invalid office_location_id, or
-- missing required metadata — aborts the signup entirely. That guarantees there
-- are never orphaned auth users or partial profiles.
--
-- SECURITY DEFINER (owned by postgres) so it bypasses RLS to insert the rows;
-- search_path is emptied and every name is schema-qualified for safety.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_user_id uuid;
begin
  insert into public.users (
    password_auth_id,
    employee_id,
    full_name,
    office_email,
    designation,
    office_location_id
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'employee_id',
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    new.raw_user_meta_data ->> 'designation',
    (new.raw_user_meta_data ->> 'office_location_id')::uuid
  )
  returning id into new_user_id;

  insert into public.user_settings (user_id) values (new_user_id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

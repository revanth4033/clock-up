-- ClockUp — seed the default office location (idempotent).
-- Coordinates below are a Hyderabad placeholder; replace latitude/longitude and
-- allowed_radius with the real office values before go-live. Re-running is safe
-- (office_name is unique; ON CONFLICT DO NOTHING).
insert into public.office_locations (office_name, latitude, longitude, allowed_radius)
values ('Hyderabad HQ', 17.385000, 78.486700, 100)
on conflict (office_name) do nothing;

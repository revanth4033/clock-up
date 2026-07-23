# Changelog

All notable changes to ClockUp are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); dates are ISO-8601.

## [1.0.0] — 2026-07-23

First production release. Complete MVP per the `/docs` specification.

### Added

- **Project foundation & database** — Next.js 16 (App Router) + Supabase setup;
  7 tables (`office_locations`, `users`, `attendance`, `points_ledger`,
  `notifications`, `user_settings`, `holidays`), enums, RLS on every table,
  `v_user_stats` / `v_week_summary` / `v_leaderboard` views, and an atomic
  `handle_new_user` signup trigger.
- **Authentication** — email/password register, login, logout, forgot/reset
  password (Supabase flow). Profile rows are created by the DB trigger (no
  orphan users). Route protection via `src/proxy.ts`.
- **Application shell** — responsive sidebar + header + mobile bottom nav,
  light/dark/system theming, page transitions, accessible layout primitives.
- **Dashboard** — read-only working-hours progress, points, weekly summary,
  attendance status, leaderboard preview, recent activity.
- **Attendance engine** — GPS-geofenced clock-in/out and missed-clock-out
  recovery via tamper-proof SECURITY DEFINER RPCs; points ledger (100 at goal,
  +10/15 min capped at 40, max 140); paginated history; live working timer.
- **Leaderboard** — ranked standings with period filter (`get_leaderboard`
  RPC), current-user highlight, summary, pagination.
- **Profile** — profile header, personal info (display name editable per ASD),
  attendance statistics (from views), recent activity, secure change-password.
- **Settings** — theme (persisted to `user_settings`, synchronized with
  next-themes across devices), notifications preference, read-only account
  summary, application info, sign-out (with confirm) + change-password link.

### Production-readiness pass (release hardening)

- **Security** — fixed an open-redirect on login: the post-login `redirect`
  param now rejects protocol-relative (`//host`) and backslash targets, not
  just requiring a leading `/`.
- **Security** — internal Supabase error messages are no longer returned to
  clients on password update / change-password; a friendly message is shown and
  the raw error is logged server-side.
- **Performance** — `getSettings` wrapped in React `cache()` (removes a
  duplicate `user_settings` query on `/settings`); page-transition animation
  moved from framer-motion to CSS (`tw-animate-css`), removing a heavy client
  dependency and making the template a Server Component.
- **Cleanup** — removed dead files (`empty-page`, unused `select`/`separator`
  UI primitives, unused browser Supabase client); removed the unused
  `framer-motion` dependency; moved the `shadcn` CLI to `devDependencies`;
  extracted a shared `fetch-json` client helper (was duplicated across 4
  feature `api.ts` files); de-duplicated `initialsOf` and the leaderboard medal
  colors.
- **UI/UX polish** — added the missing `attendance/error.tsx`; gave page titles
  the heading font; added screen-reader `h1`s to Dashboard and Settings.
- **Documentation** — added Architecture Decision Records (`docs/adr/ADR-001…007`)
  and the release docs (`README`, `CHANGELOG`, `RELEASE_NOTES`,
  `KNOWN_LIMITATIONS`, `TECHNICAL_DEBT`, `PROJECT_STRUCTURE`).

### Known limitations

See `KNOWN_LIMITATIONS.md`. Notable: timestamps are UTC (no per-office
timezone); notification **delivery** is deferred (the preference persists);
avatar upload and holidays table are reserved for future releases.

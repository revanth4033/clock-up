# Changelog

All notable changes to ClockUp are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); dates are ISO-8601.

## [1.1.0] — 2026-07-24

**Time Credits** — a gamified balance earned by working past the daily goal and
redeemable to reduce required hours. Ships behind two feature flags
(`ENABLE_TIME_CREDITS`, `ENABLE_CREDIT_REDEMPTION`), both **off** by default, so
with the flags off the app behaves exactly like v1.0. ADR-009 is the source of truth.

### Added

- **Time Credits ledger & earning** — append-only `time_credit_ledger` with a
  `v_time_credit_balance` view; a completed day earns `max(0, worked − 540)`
  credits (Worked only) at clock-out, awarded atomically inside the settlement RPC.
- **Redemption** — reserve credits against an open day (a "hold"); at clock-out,
  settlement applies `min(requested, shortfall, available)` (only when the daily
  minimum-work threshold is met), consuming credits so **Counted Time = Worked +
  Applied Redeemed**. Holds are single-shot and idempotent (partial unique
  indexes); `create_or_update_redemption` / `cancel_redemption` RPCs.
- **Read models (CQRS)** — `v_attendance_settlement` per-day projection; a
  presentation service + settlement-read repository expose Today's Summary, Credit
  Summary, Today's Redemption, and settlement history.
- **API** — read routes `GET /dashboard/today`, `/credits/summary`,
  `/redemption/today`; write routes `POST /redemption`, `/redemption/cancel`.
- **UI** — dashboard Time Credits section (Worked / Redeemed / Counted / Points /
  Earned + Counted-based goal progress), Credit Balance card, Redeem Credits card +
  dialog with backend-authoritative validation, full redemption status states, and
  attendance history extended with Redeemed / Counted / Earned columns.

### Changed

- **Points model simplified to a flat 100.** Points are now `100` when Counted Time
  ≥ 540 min, else `0`. The v1.0 overtime bonus (+10 per extra 15 min, capped at 40,
  max 140/day) is **removed**, and historical points were normalized to the flat
  rule. Points and Time Credits are orthogonal systems (never converted).

### Security

- **Restricted direct access to the credit RPCs** — revoked `EXECUTE` on
  `add_time_credit()` and `consume_time_credit()` from `authenticated`, `public`,
  and `anon`. Closes an RC1-audit blocker where any signed-in user could self-mint
  credits via a direct PostgREST RPC call. The legitimate earning and settlement
  paths (direct ledger `INSERT` inside SECURITY DEFINER functions) are unaffected.

### Removed

- Dead Phase-2 infrastructure with zero importers: `credits.service.ts`,
  `credits.repository.ts`, `features/credits/calc.ts`, and the orphaned
  `TimeCreditEntry` / `TimeCreditSummary` / `TimeCreditEntryType` domain types.
  Corrected stale "not yet wired" comments left from the staged rollout.

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

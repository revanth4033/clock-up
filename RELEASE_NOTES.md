# ClockUp v1.0.0 — Release Notes

**Release date:** 2026-07-23

ClockUp is a gamified employee work-hours tracking platform. v1.0 delivers the
complete MVP defined in the product documentation (`/docs`): employees clock in
and out from an approved office location, watch their progress toward a daily
9-hour goal, earn points, and climb a company leaderboard.

## Highlights

- **Clock in / clock out with GPS geofencing.** Attendance is only valid inside
  an approved office radius. All timing, points, and status are computed
  server-side by tamper-proof database functions — the client cannot forge them.
- **Points & gamification.** 100 points at the 9-hour goal, +10 per extra 15
  minutes (bonus capped at 40, max 140/day), recorded in an append-only ledger.
- **Live dashboard.** Real-time working timer, progress ring, weekly summary,
  points, attendance status, leaderboard preview, and recent activity.
- **Leaderboard.** Company standings with period filters and your rank
  highlighted.
- **Profile & statistics.** All-time working days, hours, averages, and points —
  plus editable display name and a secure change-password flow.
- **Settings.** Light / dark / system theme that persists to your account and
  follows you across devices; a notifications preference; account summary; and
  sign-out.
- **Polished, accessible UI.** Responsive from mobile to desktop, full dark
  mode, keyboard-operable, with designed loading / empty / error states.

## Security & quality

- Row-Level Security on every table; server-authoritative RPCs for all
  attendance writes; passwords handled entirely by Supabase Auth (never stored
  or logged); current-password re-verification before a change.
- Post-login redirects are constrained to same-origin paths (no open redirect).
- Clean build with zero TypeScript and zero ESLint errors; end-to-end verified
  (authentication, attendance engine + points + RLS, profile, settings, theme
  persistence).

## Getting started

1. `cp .env.example .env.local` and fill in your Supabase URL + publishable key.
2. `supabase db push` to apply migrations.
3. `npm install && npm run dev` (Node 22 LTS).

## Known limitations

Timestamps are UTC (no per-office timezone yet); notification **delivery** is
deferred to a later release (the preference is stored); avatar upload, the
holidays calendar, and analytics are reserved for future versions. See
`KNOWN_LIMITATIONS.md` and `TECHNICAL_DEBT.md` for the full list and the v1.1
backlog.

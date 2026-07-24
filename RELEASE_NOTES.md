# ClockUp v1.1.0 — Release Notes

**Release date:** 2026-07-24

ClockUp is a gamified employee work-hours tracking platform. **v1.1 adds Time
Credits** — a way to bank time worked beyond the daily goal and redeem it to
reduce required hours on a later day — on top of the complete v1.0 MVP (GPS
clock-in/out, points, leaderboard, profile, settings). Time Credits ship behind
feature flags that default **off**, so an install behaves exactly like v1.0 until
the flags are enabled.

## What's new in v1.1

- **Earn Time Credits.** A completed day earns one credit per minute worked past
  the 9-hour goal (`max(0, worked − 540)`), recorded in an append-only ledger and
  awarded atomically at clock-out.
- **Redeem credits to meet your goal.** Reserve credits against an open day; at
  clock-out, settlement applies the smaller of what you requested, your remaining
  shortfall, and your available balance — so **Counted Time = Worked + Applied
  Redeemed** — provided you've met the daily minimum-work threshold.
- **Dashboard & history.** A Time Credits section shows Worked, Redeemed, Counted,
  Points, and Earned with a Counted-based goal ring; a Credit Balance card shows
  balance / reserved / available; a Redeem Credits card drives the flow. Attendance
  history gains Redeemed / Counted / Earned columns so each day's result is legible.

## Points model change

Points are now a **flat 100** when Counted Time reaches the 9-hour goal, and `0`
otherwise. The previous overtime bonus (+10 per extra 15 minutes) has been removed
and historical points normalized. Points and Time Credits are independent systems
and are never converted into one another.

## Carried over from v1.0

Clock in / out with GPS geofencing; a live dashboard (working timer, progress ring,
weekly summary, leaderboard preview, recent activity); company leaderboard with
period filters; profile & statistics with a secure change-password flow; light /
dark / system theme persisted to your account; and a polished, accessible,
responsive UI with designed loading / empty / error states.

## Security & quality

- Row-Level Security on every table; all attendance, points, credit-earning, and
  redemption-settlement writes go through tamper-proof SECURITY DEFINER RPCs that
  derive identity server-side. The credit ledger can only be written by those
  internal paths — the low-level `add_time_credit` / `consume_time_credit` helpers
  are not callable by clients (fixed in v1.1 hardening).
- Passwords handled entirely by Supabase Auth; post-login redirects constrained to
  same-origin paths.
- Clean build with zero TypeScript and zero ESLint errors; end-to-end verified
  (settlement, attendance, credits, redemption, read models, UI, and the security
  fix), with the flag-off path confirmed identical to v1.0.

## Getting started

1. `cp .env.example .env.local` and fill in your Supabase URL + publishable key.
2. `supabase db push` to apply migrations.
3. `npm install && npm run dev` (Node 22 LTS).
4. To enable Time Credits, set `ENABLE_TIME_CREDITS=true` (and
   `ENABLE_CREDIT_REDEMPTION=true` for redemption) in the environment and restart.

## Known limitations

Timestamps are UTC (no per-office timezone yet); notification **delivery** is
deferred (the preference is stored); avatar upload, the holidays calendar, and
analytics are reserved for future versions. See `KNOWN_LIMITATIONS.md` and
`TECHNICAL_DEBT.md`.

# ADR-002 — Attendance Engine in PostgreSQL

**Status:** Accepted (2026-07-23, attendance milestone).

## Context

Attendance is the heart of ClockUp and the part most tempting to cheat: a user
could gain points by faking their clock-in time, their location, or their worked
duration. The business rules (BRD) are specific and safety-critical:

- A day has exactly one attendance row; clock-in and clock-out are distinct steps.
- Clocking is only valid inside an office geofence (Haversine distance ≤ radius).
- Worked minutes are `clock_out − clock_in`; points derive from worked minutes
  (100 at the 9-hour goal, +10 per extra 15 min, bonus capped at 40, max 140).
- Time must be **server** time; the client must not be trusted for it.

These steps must be **atomic** — a read of the current row, a geofence check, a
duration/points computation, the row update, and the ledger insert must all
succeed together or not at all, with no race between concurrent requests.

## Decision

Implement the attendance engine as **PostgreSQL `SECURITY DEFINER` functions**
(`clock_in`, `clock_out`, `recover_missed_clock_out`, plus `geo_distance_meters`
and `points_for_minutes` helpers) in `supabase/migrations/…_attendance_functions.sql`.
The service/repository layers only invoke these RPCs; **no attendance business
rule lives in React or Node.**

Each mutating RPC:

1. Resolves the caller server-side via `current_app_user_id()` (maps `auth.uid()`
   → `public.users.id`); raises `AUTH_REQUIRED` if absent.
2. Locks the day's row with `SELECT … FOR UPDATE` (prevents double clock-in/out
   races).
3. Validates state (`NOT_CLOCKED_IN`, `ALREADY_CLOCKED_OUT`, …) and the geofence
   (`OUTSIDE_GEOFENCE`) — the client only ever supplies raw GPS coordinates.
4. Uses `now()` (server time) for all timestamps; computes worked minutes and
   points via `points_for_minutes`.
5. Updates the attendance row **and** writes the points ledger in the **same
   transaction** (a function is one implicit transaction).

The client cannot supply timestamps, worked minutes, points, or status — only
coordinates. Everything authoritative is derived inside the database.

## Alternatives Considered

1. **Compute in React/Node, write plain rows via the Supabase client.** Trivially
   spoofable (fake times/points), and multi-statement writes over the wire are
   not atomic — a crash mid-sequence leaves a half-finished day. Rejected.
2. **Compute in a Node service using the Supabase service-role key.** Centralizes
   logic but requires shipping a god-mode key to the server and hand-rolling
   transaction handling; larger blast radius if the key leaks (see ADR-005).
   Rejected.
3. **Client computes, server validates.** Duplicates every rule in two languages
   and still needs the authoritative server path — more code, same trust problem.
   Rejected.

## Consequences

**Positive**

- **Tamper-proof:** timing, geofence, duration, points, and status are all
  server-authoritative and impossible to forge from the client.
- **Atomic:** row lock + single-transaction update+ledger eliminates races and
  partial writes.
- Rules live in exactly one place (SQL), close to the data they govern.
- Verified end-to-end (24/24 checks: formula, geofence, atomicity, ledger,
  recovery, RLS).

**Negative / costs**

- Business logic in SQL is less familiar to some developers and is tested via
  integration (real DB) rather than unit tests.
- Changing a rule means a new migration, not a code deploy.
- Logic is split between SQL (rules) and TypeScript (orchestration/UI).

## Future Considerations

- Per-office timezone handling belongs here (currently day boundaries are UTC —
  see KNOWN_LIMITATIONS). Add a `timezone` column and convert inside the RPCs.
- Missed-clock-out is detected on next login; a scheduled job could detect it
  proactively without changing the RPC contract.
- If rules grow complex, add SQL-level tests (pgTAP) alongside the e2e suite.

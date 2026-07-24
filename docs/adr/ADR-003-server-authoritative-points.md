# ADR-003 — Server-Authoritative Points System

**Status:** Accepted (2026-07-22 approved decision; implemented 2026-07-23). The
server-authoritative _architecture_ described here still stands, but the points
_formula_ (100 at goal + overtime bonus) is **superseded by
[ADR-009](./ADR-009-credit-redemption-and-points.md)** as of v1.1.0 — points are
now a flat 100 at the goal with no overtime bonus.

## Context

Points drive the gamification and the leaderboard, so their integrity is
reputational: if a user could inflate their points, the whole feature loses
meaning. Two questions had to be answered early:

1. Where do points **live** — denormalized on the attendance row, or in their own
   table?
2. Who is allowed to **write** them?

The BRD defines points purely as a function of worked minutes, and the DDD marks
the points table **read-only** to clients.

## Decision

- **`points_ledger` is the single source of truth for points.** It is an
  append-only table of `(user_id, attendance_id, reason, points)` rows. A day's
  points are two auditable entries — `'Daily goal (9h)'` (base) and
  `'Overtime bonus'` — inserted only when non-zero.
- **Points are never stored on the `attendance` row.** The attendance row records
  `worked_minutes`/`extra_minutes` (facts), not a `points` column. Any total is
  computed by summing the ledger (via `v_user_stats` / `v_leaderboard`).
- **Points are calculated and written only on the server**, inside the attendance
  `SECURITY DEFINER` RPCs (ADR-002), using `points_for_minutes(worked)`.
- **Clients can never write points.** `points_ledger` has RLS with a `SELECT`
  policy only — no insert/update/delete policy exists for `authenticated`, so all
  client writes are denied. The RPCs (owned by `postgres`) are the only writers.

## Alternatives Considered

1. **Store a `points_earned` column on `attendance`.** Simpler reads, but
   denormalizes a derived value: any change to the points formula would require a
   backfill, and a bug could silently desync the stored total from reality. It
   also invites client-side writes. Rejected (explicit approved decision).
2. **Compute points on read only (no ledger), from `worked_minutes`.** Avoids a
   table, but loses the audit trail (why did a user get these points? was there a
   recovery/adjustment?) and recomputes on every leaderboard read with no record
   of history. Rejected.
3. **Let the client insert ledger rows, validated by a CHECK/trigger.** Still
   exposes a write path and pushes trust to the edge. Rejected in favor of
   server-only writes.

## Consequences

**Positive**

- **Tamper-proof and auditable:** every point traces to a ledger row with a
  reason and an attendance link; the ledger is the immutable record.
- One formula, one writer (the RPC) — no denormalization to keep in sync.
- Recovery of a missed clock-out re-derives points cleanly through the same path.
- Verified: the e2e suite confirms the ledger sums correctly and that a client
  **cannot** insert into `points_ledger`.

**Negative / costs**

- Totals require a `SUM` over the ledger (served by the pre-aggregated
  `v_user_stats` / `v_leaderboard` views, so reads stay cheap).
- Append-only means corrections are new compensating rows, never edits (by design).

## Future Considerations

- Manual adjustments/bonuses (e.g. HR corrections) fit naturally as new ledger
  rows with a distinct `reason` — no schema change needed.
- If leaderboard reads become hot at scale, the views can be materialized or the
  ledger periodically rolled up (see ADR-002 / KNOWN_LIMITATIONS on scale).

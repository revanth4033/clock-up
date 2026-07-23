# ADR-008 — Time Credits System (staged migration)

**Status:** Proposed — Phase 1 (architecture preparation) landed; Phase 2
(implementation) not yet started. Related: ADR-003 (server-authoritative points).

## Context

We are introducing **Time Credits**: one credit per minute worked beyond the
daily 9h goal (540 min) — e.g. 9h05m → 5, 9h27m → 27, 10h14m → 74. Credits will
later be **redeemed to reduce required working hours**. This is a staged
migration; redemption/consumption is out of scope for early phases.

The existing points system is the constraint that shapes every option. Points
live in one append-only table, `points_ledger (id, user_id, attendance_id,
reason, points integer, created_at)`, and the **`points` column is the single
shared scoring source for the whole app**:

- `v_user_stats.total_points` → `SUM(points_ledger.points)` (dashboard, profile
  stats, leaderboard summary)
- `v_leaderboard.total_points` → `SUM(points)` (dashboard preview)
- `get_leaderboard(period)` RPC → `SUM(p.points)` (leaderboard, all periods)
- `pointsRepository.findSince` → sums for the dashboard "today/this week" figures

Writes happen **only** inside the `clock_out` / `recover_missed_clock_out`
`SECURITY DEFINER` RPCs; RLS on `points_ledger` is `SELECT`-own-only (no client
writes). This is the proven "append-only ledger + RPC writer + select-own RLS +
pre-aggregated view" pattern (ADR-002/003/005).

## Decision

**Phase 1 (this change): preparation only, zero behavior/DB change.** No new
table, no new columns, no earning/UI/attendance changes. We added inert,
forward-looking scaffolding:

- `TimeCreditEntry` / `TimeCreditSummary` types (`src/types/domain.ts`) — signed
  `credits` so a future negative "used" entry needs no type change.
- Pure calculators (`src/features/credits/calc.ts`): `creditsForWorkedMinutes`,
  `creditBalance`, `toCreditSummary`, and `TIME_CREDIT_PER_EXTRA_MINUTE`. These
  encode the earning rule as one tested source of truth for the Phase 2 RPC.
  **Nothing in the running app imports them**, so points behavior is unchanged.

**Phase 2 (recommended, not built): a dedicated `time_credit_ledger` table** —
do **not** reuse or overload `points_ledger`.

## Alternatives Considered (for Phase 2 storage)

1. **Reuse `points_ledger` as-is (credits in the `points` column).**
   **Rejected — not viable.** Every leaderboard/stats reader does `SUM(points)`,
   so credits would be counted as points (corrupting all scoring), and a future
   negative "used" credit would *reduce a user's leaderboard score*. The one
   column cannot mean both "score" and "spendable balance".

2. **Extend `points_ledger` (add an `entry_type`/discriminator, and/or a signed
   `credits` column).** Workable but poor fit: the scoring views + RPC would all
   have to be modified to filter `entry_type = 'points'` (touching frozen v1.0
   leaderboard/stats SQL — risk and coupling), the `points` column name becomes a
   misnomer for credit rows, and two very different accounting models (additive
   scoring vs. net consumable balance) get overloaded onto one table. Higher
   blast radius, ongoing coupling.

3. **Dedicated `time_credit_ledger` table.** A new append-only table
   `(id, user_id, attendance_id, entry_type ['earned'|'used'|'adjustment'],
   credits integer /* signed */, reason, created_at)` with its own `SELECT`-own
   RLS, credits written by the existing `clock_out`/`recover` RPCs (extended, not
   restructured), and a `v_time_credit_balance` view summing per user.
   **Recommended.**

## Why Option 3 (reasoning from this codebase)

- **Zero risk to frozen v1.0 scoring.** The leaderboard/dashboard/stats never
  touch the new table, so points behavior is guaranteed unchanged — satisfying
  the migration's "don't break existing functionality" goal without editing any
  scoring view or RPC read path.
- **It fits the architecture we already have.** The app already ships the exact
  pattern this needs — append-only ledger + `SECURITY DEFINER` writer + select-own
  RLS + pre-aggregated SQL view (points_ledger + clock_out + v_user_stats). A
  `time_credit_ledger` slots into that pattern identically, keeping repositories,
  services, RPCs, RLS, and views clean (a `creditsRepository` +
  `credits.service` mirror the points/stats layers).
- **Credits are a genuinely different domain than points** — net balance, signed
  consumption, redemption against required hours. A separate table lets each
  evolve independently and keeps each correct; overloading `points_ledger`
  (Option 2) forces two models into one place and repeatedly risks the scoring
  path.
- **Minimal, reversible footprint.** An additive new table alters no existing
  table/column, so it cannot break backward compatibility — the same safety
  property that made the rest of the schema safe to migrate.

The only cost is one extra small table, which the codebase's conventions and
scale comfortably absorb; "prefer reuse" is outweighed here because reuse cannot
be done *cleanly* (Options 1–2 both compromise the scoring source of truth).

## Consequences

- **Now:** no runtime/DB change; points work exactly as today; a typed, tested
  calculation foundation exists for Phase 2.
- **Phase 2:** add the migration (`time_credit_ledger` + RLS + balance view),
  extend `clock_out`/`recover` to also write an `earned` credit row from
  `worked_minutes`, add `creditsRepository` + `credits.service` returning a
  `TimeCreditSummary`, and (optionally) surface the balance in the UI. None of
  this disturbs the points ledger.

## Future Considerations

- **Redemption (Phase 3+):** record consumption as negative `used` rows; the
  signed `credits` column and `creditBalance` helper already anticipate this.
- **Backfill:** optionally seed historical `earned` credits from existing
  completed attendance (`worked_minutes − 540`) in a one-off migration.
- **Timezone:** credit earning inherits the same UTC day-boundary caveat as
  attendance (see KNOWN_LIMITATIONS) and should be revisited with it.

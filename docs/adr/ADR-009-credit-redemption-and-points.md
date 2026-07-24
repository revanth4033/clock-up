# ADR-009 — Time Credit Redemption & the Flat-100 Points Model

**Status:** Accepted — implemented in v1.1.0 (frozen product specification). This
ADR is the **source of truth** for all Time-Credit and Points implementation. It
refines the redemption direction sketched in ADR-008 and **changes the points
rule** established in ADR-003. Where this ADR and ADR-003/ADR-008 differ, this
ADR wins.

**Scope of this document:** business rules + architecture only. No code, schema,
or migrations are created by this ADR.

---

## 1. Context

The Time-Credit programme reached its final product shape after Phases 1–3
(earning) and the 4A design reviews. Two rewards now exist and are declared
**completely independent**:

- **Points** — recognition / attendance consistency / leaderboard.
- **Time Credits** — the reward for overtime, and (new) a redeemable currency
  that can cover a daily shortfall.

Points move from the v1.0 "100 + overtime bonus, based on worked minutes" model
to a **flat 100, based on Counted Time**. Credits are earned from physical
overtime and may be **redeemed** to complete a short day.

Existing implementation this builds on: append-only `time_credit_ledger`
(+ `v_time_credit_balance`, `add_time_credit`, balance-checked
`consume_time_credit`), flag-gated earning in `clock_out`/`recover`
(`ENABLE_TIME_CREDITS`), and the attendance engine (`clock_in`/`clock_out`/
`recover_missed_clock_out`, `points_ledger`, `DAILY_GOAL_MINUTES = 540`).

## 2. Decision — the two systems

Points and Time Credits are **orthogonal** and never convert into each other.

| | **Points** | **Time Credits** |
| --- | --- | --- |
| Purpose | Recognition, consistency, leaderboard | Overtime reward + redeemable currency |
| Rule | `100 if Counted ≥ 540 else 0` (**flat**) | Earned `= max(0, Worked − 540)` |
| Basis | **Counted Time** (Worked + Applied) | **Physical Worked** minutes only |
| Bonus | **None** (overtime bonus removed) | 1 credit per overtime minute |
| Store | `points_ledger` — one 100 row per goal-day | `time_credit_ledger` |

**System goals (must never overlap):** Points = recognition / consistency /
leaderboard. Time Credits = overtime reward / future flexibility.

## 3. Core definitions

- **Worked Time** — physical minutes, server-computed (`clock_out − clock_in`).
  Unchanged and un-spoofable.
- **Applied Redeemed Credits** — credits actually consumed for the day at
  settlement (≤ requested; only what is needed).
- **Counted Time** `= Worked + Applied`. Drives **goal completion** and **Points**.
- **Available Credit Balance** `= ledger_balance − Σ(pending holds)`.
- **Points** `= 100 if Counted ≥ 540 else 0`.
- **Credits Earned** `= max(0, Worked − 540)` — **from Worked only, never Counted.**

**Worked examples** — Points: 9h→100, 9h15m→100, 10h→100, 8h30m+30 redeemed
(Counted 9h)→100. **Credits:** 9h→0, 9h15m→15, 9h46m→46, 10h→60.

## 4. Redemption — hold / reservation model (approved)

Redemption is an **authorization hold** on credits for one specific day,
**settled at completion**. The ledger only ever records the final consumed
amount.

```
Clock In → Redeem (hold) → [adjust / cancel] → Clock Out → Settlement
                                                              → consume only what is needed
                                                              → release the rest
```

- **When:** after Clock In, while `working`, before Clock Out (bound to that
  day's `attendance_id`). Pre-clock-in and past-day redemption are out of scope.
- **Eligibility (Minimum Physical Work, policy #1):** a hold may be created only
  once **Worked-so-far ≥ `MIN_WORK_MINUTES`** (default **240** = 4h), and
  settlement re-checks **final Worked ≥ `MIN_WORK_MINUTES`**. Enforced in both
  the create RPC and settlement (tamper-proof). `MIN_WORK_MINUTES` is a
  **configurable business rule**, never an inline literal (see §9).
- **Request ceiling:** `Requested ≤ min(Shortfall_now, Available)`, where
  `Shortfall_now = max(0, 540 − Worked-so-far)`. The request is a **ceiling**,
  not a guaranteed spend.
- **Adjust / cancel** while `pending` (releases or resizes the hold; no ledger
  movement).
- **Lifecycle carries through missed → recovery:** a forgotten clock-out keeps
  the hold `pending`; recovery settles it (parity with clock-out). A hold on a
  day left in `missed_clock_out` beyond a policy window is auto-**released** so
  credits are never reserved indefinitely (cleanup task, §9/§11).

## 5. Settlement algorithm (canonical — clock-out **and** recovery)

Executed inside the existing attendance transaction, atomic and idempotent:

```
Worked    = physical minutes                                   # unchanged
Shortfall = max(0, 540 − Worked)
Applied   = (Worked ≥ MIN_WORK_MINUTES)
              ? min(Requested, Shortfall, Available)
              : 0
Counted   = Worked + Applied
Points    = 100 if Counted ≥ 540 else 0                        # flat; replaces 100+bonus
Earned    = max(0, Worked − 540)                               # from Worked only
```

Writes (same transaction):
- `points_ledger`: one `'Daily goal'` row of **100** iff `Counted ≥ 540` (no
  overtime-bonus row — ever).
- `time_credit_ledger`: `used −Applied` (if `Applied > 0`) **xor** `earned +Earned`
  (if `Earned > 0`). They are **mutually exclusive** (Worked < 540 ⇒ Earned 0;
  Worked ≥ 540 ⇒ Shortfall 0 ⇒ Applied 0).
- `time_credit_redemption`: → `applied` (with `applied_credits`) or `released`.

**Invariant:** a completed day writes **≤ 1** points row and **≤ 1** credit
movement (`used` xor `earned`). No day both earns and consumes credits.

## 6. Data model

- **New table `time_credit_redemption`** (stateful hold): `id, user_id,
  attendance_id, requested_credits, applied_credits (null until settled),
  status (pending | applied | cancelled | released), created_at, settled_at`.
  Select-own RLS; writes only via SECURITY DEFINER RPCs; a partial unique index
  enforces **one active (`pending`) hold per attendance**.
- **Reuse `time_credit_ledger`** for the single settled `used` movement
  (`attendance_id` set) — the immutable record.
- **Extend `v_time_credit_balance`** additively with `reserved_credits` and
  `available_balance` (`= balance − Σ pending`). Existing balance semantics
  unchanged.
- **`points_ledger`**: **no schema change**; write logic changes to flat-100-
  from-Counted (no bonus row).

Rationale (from ADR-008): mutable, cancellable holds do not belong in an
append-only ledger — state lives in tables (like `attendance`), movements live
in ledgers (like `points_ledger`).

## 7. Historical points normalization (policy #2)

To avoid two scoring systems, existing history is **normalized to the flat
model** (one-off migration, Phase 4C): for every completed attendance, replace
its `points_ledger` rows with a single **100** iff `worked_minutes ≥ 540`, else
**0**. Recovered/edited days recompute from their stored `worked_minutes`.
Consequence: leaderboard totals visibly shift to `100 × goal-days` and seed/
historical days below 540 worked drop to 0. This is intended.

## 8. Presentation (concepts kept strictly separate)

- **Dashboard (today):** **Worked · Redeemed · Counted · Available Balance ·
  Points** — five distinct values; the goal ring fills against **Counted**.
- **Attendance History (per completed day):** **Worked · Redeemed · Counted ·
  Points · Credits Earned** — fully transparent; days without redemption render
  as today.
- **Copy:** the "How Points Work" card changes to *"100 points for meeting your
  daily goal (9h Counted)."* (Overtime bonus references removed.)
- **Redeem dialog (policy #3):** shows **Available Credits**, **Today's
  Shortfall** (`max(0, 540 − Worked-so-far)`), and **Recommended Redemption**
  (`min(Shortfall, Available)`); the user may redeem any amount **up to the
  recommended value**.

## 9. Configurable business rules

- `DAILY_GOAL_MINUTES = 540` (existing).
- `MIN_WORK_MINUTES = 240` (**new**, policy #1). A **single source of truth**,
  referenced by the settlement RPC, the create-redemption RPC, and the app —
  never an inline `240`. Phase-4B chooses between a named constant (deploy-time,
  mirroring how `540` is defined) and a `credit_policy` config row (HR-tunable at
  runtime); a runtime config row is preferred if HR must change it without a
  deploy.
- Feature flags: `ENABLE_TIME_CREDITS` (earning, existing) and a new
  `ENABLE_CREDIT_REDEMPTION`. Off ⇒ each subsystem behaves as its current
  baseline.

## 10. Edge cases (authoritative list)

| Case | Resolution |
| --- | --- |
| Redeem twice / adjust | One active hold per attendance; second call resizes it |
| Redeem too many | Rejected if `> Available`; UI caps request at Recommended |
| Cancel | Allowed while `pending` → `cancelled`, hold released |
| **Worked < 4h at settlement** | `Applied = 0`, hold released; no goal, points from Worked only |
| Never clocks out | Hold stays `pending` → carried to recovery; auto-released if day abandoned |
| Recovery | Settles the hold with the same algorithm; flat-100 from Counted |
| Over-work after redeem | `Shortfall = 0 ⇒ Applied = 0`; hold released; Earned may apply |
| Redeem more than needed | Settlement consumes only `Shortfall`; releases remainder |
| Redeem less than shortfall | `Counted < 540` ⇒ 0 points; UI recommends exact shortfall |
| Duplicate API / double-submit | Idempotent via one-active-per-attendance + settle-once (`pending→applied` under lock); duplicate clock-out already rejected |
| Multiple devices / refresh | Server is source of truth (hold row); mutations serialized by a per-user/attendance advisory lock |
| Balance changed before settle (expiry, adjustment) | Settlement re-validates `Available`; consume can't exceed real balance |
| Abandoned hold (missed, never recovered) | Auto-released after policy window / cleanup pass |
| Timezone | "Today"/day boundaries remain UTC (existing limitation); revisit with the timezone debt |
| Half-day + redeem to goal | **Permitted** by the 4h floor: 100 points + goal via banked credits (accepted product risk) |

## 11. Roadmap (each phase flag-gated & independently testable)

- **4B — Redemption infrastructure (dormant):** `time_credit_redemption` table +
  RLS + one-active index; `create_or_update_redemption` / `cancel_redemption`
  RPCs (Available + 4h checks, per-user lock); `reserved`/`available` on the
  balance view; repository + service. Not wired into clock-out. Choose the
  `MIN_WORK_MINUTES` config mechanism. **Also design the abandoned-hold cleanup.**
- **4C — Points model migration:** flat 100 from Counted (= Worked pre-
  redemption), remove overtime bonus, normalize historical `points_ledger`
  (policy #2), update the "How Points Work" card + docs. Independently testable;
  leaderboard values shift here.
- **4D — Settlement:** clock-out/recover consume the day's hold, compute Counted,
  Points from Counted, Earned from Worked; enforce the 4h gate; idempotent;
  release on missed / settle on recovery.
- **4E — Read APIs + display:** surface Worked / Redeemed / Counted / Available /
  Points / Credits Earned on the dashboard and history.
- **4F — Redemption UI:** the Redeem dialog (Available, Shortfall, Recommended),
  redeem / adjust / cancel.
- **4G — Policy & rollout:** enforce/expose `MIN_WORK_MINUTES`, abandoned-hold
  cleanup, credit-expiry interaction, prod flag enablement, monitoring.

## 12. Consequences

- **Simpler points math** (100/0), one ledger row per goal-day, no `/15`
  bonus/cap logic.
- **Clean orthogonality:** Credits reward overtime (Worked − 540); Points reward
  consistency (100 at Counted ≥ 540). No overlap, easy to explain, no laundering
  (Earned ignores Counted).
- **Deliberate behaviour changes:** points now depend on redemption (a completed-
  via-credits day scores 100); the leaderboard rewards consistency, not duration;
  historical points are normalized. All intended.
- **Accepted residual risk:** the 4h floor permits full consistency points on a
  half-day funded by previously-earned credits (§10, row "Half-day + redeem").
- **New operational task:** abandoned-hold cleanup to prevent indefinitely
  reserved credits.

## 13. Open items (do not block 4B)

1. `MIN_WORK_MINUTES` mechanism: named constant vs `credit_policy` config row
   (recommend runtime config if HR must tune it).
2. Abandoned-hold release window (e.g., N days) — decide in 4B/4G.

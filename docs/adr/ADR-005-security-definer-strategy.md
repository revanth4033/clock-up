# ADR-005 — SECURITY DEFINER Strategy (no service-role key)

**Status:** Accepted (2026-07-22/23). Related: ADR-002, ADR-003.

## Context

Some operations must bypass Row-Level Security: creating a user's profile during
signup, and writing the points ledger (which is read-only to clients). The
conventional Supabase approach is to use the **service-role key** on the server —
a key that bypasses RLS entirely. That key is effectively database god-mode: if
it leaks (misconfigured env, log, bundle), an attacker can read and write every
row of every user. We wanted the privilege-escalation surface to be as small as
possible.

## Decision

**Do not use a service-role key.** The application authenticates to Supabase only
with the **publishable (anon) key**, and all privileged operations are performed
by narrowly-scoped **`SECURITY DEFINER` database functions**.

How the pieces fit:

- **RLS is enabled on every table**, with own-row policies keyed on
  `current_app_user_id()` (a `SECURITY DEFINER` SQL function mapping
  `auth.uid()` → `public.users.id`). Clients can only see/modify their own rows;
  `points_ledger` has a `SELECT`-only policy (no client writes at all).
- **`SECURITY DEFINER` functions run as their owner (`postgres`)**, so they can
  perform exactly the privileged writes they encode — and nothing else:
  - `handle_new_user` (trigger) creates the `users` + `user_settings` rows on
    signup;
  - `clock_in` / `clock_out` / `recover_missed_clock_out` write attendance and the
    points ledger.
- Each definer function is **hardened**: `set search_path = ''` (or an explicit
  schema), every object name schema-qualified, and identity re-derived internally
  from `auth.uid()` — never trusted from a parameter. They accept only the minimal
  inputs (GPS coordinates, signup metadata), so they are not general-purpose write
  primitives.

This is why RPCs can "bypass RLS safely": they don't disable RLS globally; they
are small, audited, owner-run routines that enforce their own authorization
(`AUTH_REQUIRED`, ownership `WHERE user_id = v_user_id`) and encode one workflow
each.

## Alternatives Considered

1. **Service-role key on the server.** Standard and flexible, but a single
   catastrophic secret; any leak compromises all data. Larger surface than the
   MVP needs. Rejected (approved decision: no secret key for MVP).
2. **Disable RLS and enforce everything in application code.** Removes the
   database safety net entirely; one missing check exposes data. Rejected.
3. **Broad, general-purpose definer functions.** Would re-create the god-mode
   problem inside SQL. Rejected in favor of one narrow function per workflow.

## Consequences

**Positive**

- **Minimal blast radius:** no god-mode key exists to leak; the only browser-
  reachable key is the RLS-enforced publishable key.
- Authorization is enforced at the database, the last line of defense — verified:
  a client cannot insert `points_ledger` or read another user's attendance.
- Each privileged path is small and auditable.

**Negative / costs**

- Every new privileged operation needs a new definer function + migration (more
  deliberate than "just use the admin client").
- `SECURITY DEFINER` requires care (search_path, schema-qualification, internal
  identity) — done consistently here, but a real footgun if copied carelessly.

## Future Considerations

- A `SUPABASE_SECRET_KEY` slot exists in `.env.example` (unused) for a future
  need that genuinely requires it (e.g. an admin/back-office tool); if added, it
  must remain strictly server-side and out of the request path.
- Consider `pgTAP` tests asserting the RLS policies and definer authorization
  directly, complementing the e2e RLS checks.

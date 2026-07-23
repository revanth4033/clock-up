# ADR-007 — Authentication Architecture

**Status:** Accepted (2026-07-23, authentication milestone).

## Context

ClockUp uses Supabase Auth (GoTrue) for email/password authentication. Two
records could represent a "user": the `auth.users` row that GoTrue owns, and the
`public.users` profile row the app needs (employee id, name, office, designation).
The risk is drift — an auth user with no profile, or a profile with no auth user —
which would break every downstream query. We also needed session handling that
works with React Server Components and route protection that can't be bypassed by
navigating directly to a URL.

## Decision

**`auth.users` (GoTrue) is the source of truth for identity; `public.users` is a
profile projection created atomically by the database, not the application.**

- **Profile creation via a database trigger.** `handle_new_user` (a
  `SECURITY DEFINER` trigger on `auth.users`, ADR-005) creates the `public.users`
  and default `public.user_settings` rows from the signup metadata, **inside
  GoTrue's signup transaction**. If anything fails (duplicate `employee_id`,
  invalid `office_location_id`, missing metadata), the whole signup aborts — so
  there are never orphaned auth users or partial profiles. The
  `registerUser` service just calls `signUp` with metadata; it never inserts
  profile rows.
- **Identity is linked, not duplicated.** `public.users.password_auth_id`
  references the auth user; `current_app_user_id()` maps `auth.uid()` →
  `public.users.id` for RLS and RPCs.
- **Sessions** use `@supabase/ssr` cookie clients. A single request-cached
  `getCurrentUser()` resolves `auth.getUser()` + the profile, deduped per render.
- **Protected routes** are enforced in `src/proxy.ts` (Next 16 Proxy, Node
  runtime) via `updateSession`: it refreshes the session on every request and
  redirects unauthenticated users away from protected pages (preserving an
  intended `?redirect`), and authenticated users away from `/login`/`/register`.
  `/api` routes are only refreshed — they enforce their own authorization
  (`getCurrentUser` + RLS), consistent with the RLS-backed design.
- Email confirmation is disabled (approved decision) so signup returns a session
  and logs the user in directly. Password reset uses Supabase's built-in flow.

## Alternatives Considered

1. **Create the profile in the app after `signUp` (service-side insert).**
   Non-atomic: a crash between `signUp` and the insert leaves an auth user with no
   profile; also needs elevated privileges to write another schema. Rejected in
   favor of the trigger.
2. **One combined users table (no `auth.users`).** Would mean re-implementing
   auth (hashing, tokens, reset) — exactly what GoTrue provides. Rejected.
3. **Client-side route guards only.** Bypassable by direct navigation and leaks
   protected shells before redirect. Rejected in favor of proxy-level enforcement.
4. **Middleware naming** — Next 16 renamed Middleware to **Proxy**; we migrated to
   `src/proxy.ts` accordingly (documented gotcha).

## Consequences

**Positive**

- **No auth/profile drift** — the trigger makes the pair atomic; a bad signup
  fails cleanly (e.g. duplicate employee id surfaces as a mapped 409).
- Server-authoritative route protection; protected pages never render for
  unauthenticated users.
- `getCurrentUser` caching avoids duplicate auth/profile queries per render.
- Verified end-to-end (register → auto-login, login, logout, protected redirects,
  the post-login redirect hardened against open-redirect in the readiness pass).

**Negative / costs**

- Signup logic is split: GoTrue + a SQL trigger, which is less obvious than a
  single app function (documented in code and here).
- Auth error mapping keys partly off GoTrue message substrings — brittle across
  versions (TECHNICAL_DEBT #4).

## Future Considerations

- Consolidate auth error mapping into one module and reduce substring matching.
- If SSO/OAuth or email confirmation is later required, both slot into this model
  (GoTrue stays the source of truth; the trigger still provisions the profile).
- Re-enable email confirmation by flipping the GoTrue setting; the safety-net path
  already exists in `registerUser`.

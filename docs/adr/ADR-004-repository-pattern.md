# ADR-004 — Repository Pattern

**Status:** Accepted (2026-07-22, foundation milestone).

## Context

Supabase's client returns rows in `snake_case` and lets you query from anywhere,
which makes it easy to leak database shapes and ad-hoc queries throughout the
codebase. We wanted a single seam for data access so that (a) the rest of the app
speaks clean camelCase domain types, (b) queries are discoverable and consistent,
and (c) the naming translation happens exactly once.

## Decision

Introduce a **repository layer** (`src/repositories/**`) with a clear division of
responsibility across the three layers below the UI:

- **Repository** — the _only_ code that touches the Supabase query builder / RPCs.
  Each repository owns one concern (`users`, `attendance`, `points`, `stats`,
  `settings`, `leaderboard`, `office-locations`). It:
  - takes a `SupabaseClient` as a parameter (never creates one);
  - selects **explicit columns** (no `select("*")`);
  - defines a private `Row` type and a `toDomain` mapper that converts
    `snake_case → camelCase`;
  - returns domain types from `src/types/domain.ts`. **No business logic.**
- **Service** — orchestrates repositories, applies business rules, handles auth
  (`getCurrentUser`), and returns `ServiceResult<T>` for mutations. It composes
  repositories (often in parallel via `Promise.all`) but never runs raw queries.
- **UI** — Server Components call services; Client Components call `/api/v1`
  routes. The UI only ever sees camelCase domain types; it never imports a
  repository or the Supabase client.

**snake_case is mapped to camelCase exactly once — at the repository boundary.**
Nothing above a repository sees a snake_case field. This was verified in review:
no snake_case leaks past the repositories.

## Alternatives Considered

1. **Query Supabase directly in services (no repository).** Fewer files, but
   services would mix business logic with query construction and column mapping,
   and mapping would be repeated ad hoc. Rejected.
2. **An ORM (Prisma/Drizzle) as the repository.** Would duplicate Supabase's
   generated types, complicate RLS/RPC usage, and add a migration/codegen tool on
   top of Supabase migrations. Over-engineered for the MVP. Rejected.
3. **A single generic mapper (auto snake→camel).** Tempting, but each table's
   projection and embedded joins differ (e.g. `office_locations(office_name)`),
   and an implicit mapper hides the exact shape. Explicit `Row`/`toDomain` per
   repo is clearer and type-safe. Accepted as-is.

## Consequences

**Positive**

- One place to change a query or a projection; the app above speaks a stable
  domain language.
- Explicit column selection avoids over-fetching and documents what each read
  needs.
- Testable: services can be reasoned about against domain types, not DB rows.
- Consistent structure makes a new repository trivial to add.

**Negative / costs**

- Per-repository `Row`/`toDomain` boilerplate (deliberate: explicit > magic).
- Two repositories currently read `v_leaderboard` (`stats` + `leaderboard`) — a
  small overlap noted in TECHNICAL_DEBT (#9) to consolidate later.

## Future Considerations

- Consolidate the leaderboard reads into `leaderboard.repository.ts`.
- If a table's mapping becomes very repetitive, a typed helper could reduce
  boilerplate without hiding the explicit column list.

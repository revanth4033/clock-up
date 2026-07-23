# ADR-001 — Layered Architecture (UI → Service → Repository → Database)

**Status:** Accepted (2026-07-22, foundation milestone). Applies to the whole codebase.

## Context

ClockUp is a Next.js 16 App Router application backed by Supabase. We needed a
structure that keeps business rules (the 9-hour goal, points, geofencing) in one
predictable place, keeps data access testable and swappable, and holds up as the
app grows from one module (attendance) to six (auth, dashboard, attendance,
leaderboard, profile, settings). React Server Components blur the traditional
client/server line, which makes it easy to accidentally scatter database calls
and business logic across UI files.

## Decision

Adopt a strict, one-directional layering, enforced by convention and file
location:

```
UI (Server + Client Components)
  → API route handlers (src/app/api/v1/**)   — Zod validation + ApiResponse envelope
  → Services (src/services/**, "server-only") — business logic, ServiceResult<T>
  → Repositories (src/repositories/**)        — data access, snake→camel mapping
  → Supabase (Postgres: RLS, views, RPCs)
```

Rules:

- **Server Components** call services directly. **Client Components** never call
  services (they are `import "server-only"`); they call the `/api/v1` routes via a
  thin per-feature `api.ts` built on the shared `lib/api/fetch-json.ts`.
- **Services** own business logic and orchestration, return `ServiceResult<T>` for
  mutations, and are the only layer that composes repositories.
- **Repositories** take a `SupabaseClient`, run one concern's queries, and map
  `snake_case → camelCase` at the boundary. No business logic.
- The UI never imports a repository or the Supabase client directly.

## Alternatives Considered

1. **Everything in Server Components / route handlers (no service/repo layer).**
   Fastest to write, but business rules and raw queries spread across UI files;
   no single place to change a rule; hard to test in isolation. Rejected.
2. **A heavyweight framework (NestJS-style modules, DI container, an ORM like
   Prisma/Drizzle).** More ceremony than a focused MVP needs, and an ORM would
   duplicate/fight Supabase's generated client, RLS, and SQL views. Rejected as
   over-engineering.
3. **Server Actions instead of `/api/v1` routes.** Ergonomic, but the ASD
   mandates a versioned REST surface (`/api/v1`, standard envelope) for a
   documented, client-agnostic contract. Route handlers satisfy that; Server
   Actions would not. Rejected for this milestone.

## Consequences

**Positive**

- One obvious home for every concern; a new module is a predictable set of files.
- Business rules are isolated in services and covered by end-to-end tests.
- The `/api/v1` surface matches the ASD and is consumable by any client.
- Repositories are the single seam for query changes; the rest of the app speaks
  camelCase domain types (`src/types/domain.ts`).

**Negative / costs**

- More files per feature (api, schema, service, repository, components) than a
  "just fetch in the component" approach.
- Reads deliberately return raw domain data while mutations return
  `ServiceResult<T>` — a documented asymmetry (see TECHNICAL_DEBT #3).
- Some boilerplate (each repository has its own `Row`/`toDomain`).

## Future Considerations

- If more of the API becomes internal-only, Server Actions could replace some
  route handlers without disturbing the service/repository layers.
- Unify the service return contract (reads → `ServiceResult`) if the asymmetry
  causes friction.
- The layering is deliberately lightweight — resist adding a DI container or ORM
  unless a concrete need appears.

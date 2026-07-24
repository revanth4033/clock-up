# ClockUp

Gamified employee work-hours tracking platform (v1.1). Employees clock in and out
from an approved office location, track progress toward a daily 9-hour goal, earn
points, and compete on a company leaderboard. **Time Credits** (v1.1) let
employees bank time worked beyond the goal and redeem it to reduce required hours
on a later day.

Built with **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind
CSS v4** + Base UI (shadcn base-nova), and **Supabase** (Postgres, Auth, RLS, SQL
views, SECURITY DEFINER RPCs).

## Quick start

Requires **Node 22 LTS** and the Supabase CLI.

```bash
# 1. Environment
cp .env.example .env.local        # fill in your Supabase URL + publishable key

# 2. Database (applies migrations in supabase/migrations/)
supabase db push

# 3. Install & run
npm install
npm run dev                       # http://localhost:3000
```

## Scripts

| Command                           | Purpose                  |
| --------------------------------- | ------------------------ |
| `npm run dev`                     | Dev server (Turbopack)   |
| `npm run build` / `start`         | Production build / serve |
| `npm run typecheck`               | `tsc --noEmit`           |
| `npm run lint`                    | ESLint                   |
| `npm run format` / `format:check` | Prettier                 |

Pre-commit hooks (husky + lint-staged) run ESLint + Prettier on staged files.

## Architecture

Strict layering: **UI → API routes (`/api/v1`) → services (`server-only`) →
repositories → Supabase**. Attendance timing, points, and status are computed by
tamper-proof database RPCs; Row-Level Security scopes every query to its owner.

See **[`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md)** for the full map.

## Feature flags

Time Credits ship behind two **server-only** flags (`src/lib/flags.ts`), both
defaulting **off** so the app behaves exactly like v1.0 until enabled:

- `ENABLE_TIME_CREDITS` — earn credits for time worked past the daily goal; show
  Counted Time, credit balances, and the extended attendance history.
- `ENABLE_CREDIT_REDEMPTION` — reserve and redeem credits against an open day
  (settled at clock-out).

Flags are read from the environment at request time, so rollout/rollback is an
env change + restart — no code or database migration required.

## Documentation

- **[`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md)** — stack, architecture, directory map, DB, API
- **[`docs/API.md`](./docs/API.md)** — HTTP API reference (`/api/v1`)
- **[`CHANGELOG.md`](./CHANGELOG.md)** — version history
- **[`RELEASE_NOTES.md`](./RELEASE_NOTES.md)** — release highlights
- **[`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md)** — intentional scope boundaries
- **[`TECHNICAL_DEBT.md`](./TECHNICAL_DEBT.md)** — maintainability backlog
- **[`docs/adr/`](./docs/adr/)** — Architecture Decision Records (why the system is shaped this way)
- **`/docs`** — the canonical product & design specification (source of truth)

## License

Private. All rights reserved.

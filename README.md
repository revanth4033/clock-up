# ClockUp

Gamified employee work-hours tracking platform (MVP v1.0). Employees clock in and
out from an approved office location, track progress toward a daily 9-hour goal,
earn points, and compete on a company leaderboard.

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

## Documentation

- **[`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md)** — stack, architecture, directory map, DB, API
- **[`CHANGELOG.md`](./CHANGELOG.md)** — version history
- **[`RELEASE_NOTES.md`](./RELEASE_NOTES.md)** — v1.0 highlights
- **[`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md)** — intentional scope boundaries
- **[`TECHNICAL_DEBT.md`](./TECHNICAL_DEBT.md)** — maintainability backlog
- **[`docs/adr/`](./docs/adr/)** — Architecture Decision Records (why the system is shaped this way)
- **`/docs`** — the canonical product & design specification (source of truth)

## License

Private. All rights reserved.

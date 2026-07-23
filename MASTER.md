# ClockUp — MASTER Progress Tracker

> Working name. Gamified employee work-hours tracking platform (MVP v1.0).
> **Source of truth is `/docs`.** Read the docs before building. Build one task
> at a time (DRPG). Do not skip ahead.

## Documentation index (`/docs`, RTF — do not convert/duplicate)

| Doc  | Purpose                                        |
| ---- | ---------------------------------------------- |
| PRD  | Product requirements, scope, goals             |
| FSD  | Feature scope, 8 modules, priorities           |
| BRD  | Business rules (points, geofence, statuses)    |
| UFD  | User flows and states                          |
| DDD  | Database design (6 tables, ledger, RLS, views) |
| ASD  | API spec (`/api/v1`, standard envelope)        |
| TADG | Technical architecture + dev guide             |
| DSD  | UI/UX design spec                              |
| DRPG | Development roadmap (12 phases, task-by-task)  |

## Approved decisions (2026-07-22)

1. `/docs` is the single source of truth — do not convert RTF → MD.
2. Primary brand color = **`#6366F1`** (supersedes DSD `#5B5BD6`).
3. Clock In/Out require internet in MVP; offline support out of scope.
4. Notifications stay a future phase (Phase 11).
5. Password reset uses Supabase's built-in flow (no custom API).
6. Add `GET /api/v1/office-locations` for the registration form.
7. Add a `holidays` table for future support.
8. Missed Clock Out is detected on the user's next login (no cron).
9. `points_ledger` is the single source of truth — do **not** store
   `points_earned` on the attendance table.
10. "Not Started" is a UI-only state, not a DB status enum value.

> If a new document inconsistency surfaces that isn't covered above: **stop and
> ask** — do not resolve it unilaterally.

## Phase checklist (DRPG)

- [x] **Phase 1 — Project Foundation** ✅ (see below)
- [x] **Phase 2 — Design System** ✅ (globals.css ClockUp tokens, Inter + Plus
      Jakarta Sans, #6366F1, light + dark via next-themes)
- [~] Phase 3 — Component Library (shadcn primitives added: button, dropdown-menu,
  avatar, separator, breadcrumb; app-specific cards/toasts/etc. still to come)
- [x] **Phase 4 — App Layout** ✅ (sidebar, header, mobile bottom nav,
      breadcrumbs, user-menu placeholder, page container/wrapper/header, empty-page,
      route groups, placeholder pages) — responsive verified at 390 & 1440, light+dark
- [x] **Phase 5 — Authentication** ✅ COMPLETE + HARDENED + FULLY VERIFIED
      (2026-07-23). Profile creation moved to atomic DB trigger
      (`20260723040440_handle_new_user.sql`, applied); service slimmed to signUp +
      error mapping. proxy.ts route protection. Email confirmation disabled
      (`mailer_autoconfirm:true`). All 19 e2e checks pass: register auto-login,
      trigger creates users + user_settings, login, logout, session persistence,
      protected routes, duplicate email/employee_id (both 409, atomic), password reset.
- [ ] Phase 6 — Dashboard
- [ ] Phase 7 — Attendance
- [ ] Phase 8 — Leaderboard
- [ ] Phase 9 — Profile
- [ ] Phase 10 — Settings
- [ ] Phase 11 — Notifications
- [ ] Phase 12 — Polish & Optimization

## Phase 1 — what was created

- **Next.js 16.2.11** (App Router) + **React 19.2.4** + **TypeScript 5**
  (strict) + **Tailwind CSS v4** + **ESLint 9** (flat config).
- **shadcn/ui** initialized (`components.json`, `src/lib/utils.ts` `cn()`,
  base `button.tsx`). Style `base-nova` → underlying primitives are
  **Base UI** (`@base-ui/react`), shadcn v4's current default. Icons: Lucide.
- **Prettier** (+ tailwind plugin, + `eslint-config-prettier`), **Husky**
  pre-commit running **lint-staged**.
- Scripts: `dev`, `build`, `start`, `lint`, `format`, `format:check`,
  `typecheck`, `prepare`.
- **Folder structure** per TADG (`components/{ui,common,layout}`,
  `features/{auth,dashboard,attendance,leaderboard,profile,settings}`,
  `services`, `lib`, `hooks`, `types`, `utils`, `constants`, route groups
  `(auth)` / `(dashboard)` / `api`).
- **Supabase** clients: `src/lib/supabase/client.ts` (browser) and
  `server.ts` (server, cookie-based) via `@supabase/ssr`. **No auth yet.**
- Env template `.env.example` (+ local `.env.local`).
- Git repo initialized on `main` (no commit yet — awaiting approval).

## Known follow-ups (address in the noted phase)

- **Phase 2 first task:** fix the shadcn/Tailwind-v4 font wiring in
  `globals.css` (currently `--font-sans: var(--font-sans)` is a circular
  self-reference) and apply ClockUp typography (Plus Jakarta Sans headings +
  Inter body) and the `#6366F1` indigo theme + neutral palette from the DSD.
- **Env:** fill real Supabase credentials into `.env.local` before any feature
  that talks to Supabase (Phase 5+).
- **Node runtime:** supabase-js warns Node ≤20 is deprecated; recommend
  upgrading local/CI to **Node 22 LTS**.
- **npm audit:** a few transitive advisories exist; review before deploy
  (do not `audit fix --force` blindly — it makes breaking changes).
- **Deps added per phase** (not in foundation): Zod, React Hook Form,
  TanStack Query, Framer Motion, Recharts, date-fns, next-themes.
- **Database foundation:** ✅ APPLIED + VALIDATED (2026-07-22). All 5 migrations
  pushed to remote project `crcierwaarpbmfjkkbeu`; `supabase/validate_schema.sql`
  returned 65 rows, all PASS (7 tables, 2 enums, 8 FKs, 21 indexes, 7 RLS-enabled
  tables, 14 policies, 3 views execute, 2 functions, 1 seed row).
- **Before go-live:** replace the seeded "Hyderabad HQ" office coordinates with
  the real office latitude/longitude/radius (`…_seed_office_locations.sql`).
- **Avatar storage:** DDD wants a Supabase Storage bucket for avatars — not
  created yet (out of this task's scope); add before Profile (Phase 9).
- **Leaderboard tie-break:** implemented "most recent completion" as
  `last_completion_at DESC` (BRD §8 wording is ambiguous on direction) —
  confirm this is the intended order.

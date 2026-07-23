# ClockUp — Project Structure

Gamified employee work-hours tracking platform (MVP v1.0). This document describes
the **current** implementation. The canonical product/design spec lives in `/docs`
(PRD, FSD, BRD, UFD, DDD, ASD, TADG, DSD, DRPG); the engineering decisions behind
this implementation are recorded in [`/docs/adr`](./docs/adr/) (ADR-001…007).

## Stack

| Concern     | Choice                                                               |
| ----------- | -------------------------------------------------------------------- |
| Framework   | Next.js 16.2.11 (App Router, Turbopack), React 19.2.4                |
| Language    | TypeScript (strict)                                                  |
| Styling     | Tailwind CSS v4, `tw-animate-css`, shadcn (base-nova) + Base UI      |
| Data / Auth | Supabase (Postgres + Auth + RLS + SQL views + RPCs), `@supabase/ssr` |
| Forms       | React Hook Form + Zod v4                                             |
| Theme       | next-themes (light / dark / system), persisted to the DB             |
| Toasts      | sonner                                                               |
| Runtime     | Node 22 LTS                                                          |

## Architecture — strict layering

```
UI (Server + Client Components)
        │
        ▼
API route handlers  (src/app/api/v1/**)        ← Zod validation + ApiResponse envelope
        │
        ▼
Services  (src/services/**, "server-only")     ← business logic, ServiceResult<T>
        │
        ▼
Repositories  (src/repositories/**)            ← SupabaseClient in, snake→camel out
        │
        ▼
Supabase  (Postgres: RLS, SQL views, SECURITY DEFINER RPCs)
```

- **UI never imports repositories or the Supabase client directly.** Server Components call services; Client Components call the `/api/v1` routes via a per-feature `api.ts` (all built on `src/lib/api/fetch-json.ts`).
- **Services** are `import "server-only"`, hold business logic, and return `ServiceResult<T>` for mutations (reads return domain objects / `null`).
- **Repositories** take a `SupabaseClient`, select explicit columns, and map `snake_case → camelCase` at the boundary (each has a `Row` type + `toDomain`). No `select("*")` anywhere.
- **Route protection** is enforced in `src/proxy.ts` (Next 16 renamed Middleware → Proxy); `/api` routes enforce their own authorization via `getCurrentUser` + RLS.
- **Tamper-proofing**: attendance timing, points, and status are computed exclusively by SECURITY DEFINER RPCs that derive identity server-side (`auth.uid()`); clients only supply GPS coordinates.

## Directory map (`src/`, 143 files, ~7,000 LOC)

```
app/
  (auth)/                      login, register, forgot-password, reset-password (+ layout)
  (dashboard)/                 authenticated shell (layout + template page-transition)
    dashboard|attendance|leaderboard|profile|settings/   page + loading + error
  api/v1/                      13 route handlers (auth, attendance, office-locations, profile, settings)
  auth/callback/route.ts       Supabase auth redirect handler
  layout.tsx | page.tsx        root layout (ThemeProvider, Toaster) + "/" → /dashboard
components/
  form/                        FormField, PasswordInput, SubmitButton, FormAlert
  layout/                      Header, Sidebar, MobileNav, UserMenu, Breadcrumbs, PageHeader, PageContainer, Brand, NavItem, ContentWrapper
  theme/                       ThemeProvider, ThemeToggle
  ui/                          Base UI (base-nova) primitives: Button, Input, Label, Card, Dialog, DropdownMenu, Badge, Avatar, Alert, Skeleton, Switch, Breadcrumb, Sonner
constants/                     attendance business rules, navigation
features/
  attendance/                  api, schemas, lib/geolocation, components (clock-actions, history table, pagination, missed-clock-out dialog)
  auth/                        api, schemas, components (login/register/forgot/reset forms, auth-card)
  dashboard/                   components (welcome, working-hours, points, weekly summary, quick actions, leaderboard preview, recent attendance, dashboard-card, stat, progress ring/bar, live-working-hours, greeting, status badge/card)
  leaderboard/                 components (table, tabs, summary, pagination)
  profile/                     api, schemas, components (header, personal-info, edit-name dialog, attendance-stats, password-card)
  settings/                    api, schemas, use-theme-preference, components (appearance, notifications, account, app-info, security, theme-sync)
lib/
  api/                         fetch-json (client), response (server envelope)
  supabase/                    config, server, session
  utils.ts                     cn()
repositories/                  attendance, leaderboard, office-locations, points, settings, stats, users
services/                      attendance, auth, dashboard, leaderboard, office, profile, settings, types
types/                         api (ApiResponse), domain (camelCase models)
utils/                         format (presentation helpers)
proxy.ts                       route protection (Next 16 proxy)
```

## Database (`supabase/migrations/`)

Applied in order (timestamped):

1. `enums` — `attendance_status`, `theme`
2. `core_tables` — `office_locations`, `users`, `attendance`, `points_ledger`, `notifications`, `user_settings`, `holidays`
3. `row_level_security` — RLS enabled + own-row policies on every table
4. `views` — `v_user_stats`, `v_week_summary`, `v_leaderboard` (security_invoker)
5. `seed_office_locations` — default office
6. `handle_new_user` — trigger creating `users` + `user_settings` atomically on signup
7. `attendance_functions` — `clock_in`, `clock_out`, `recover_missed_clock_out`, `geo_distance_meters`, `points_for_minutes` (SECURITY DEFINER)
8. `leaderboard_function` — `get_leaderboard(period)`

## API surface (`/api/v1`, standard `ApiResponse` envelope)

| Method      | Path                                                                     | Purpose                                 |
| ----------- | ------------------------------------------------------------------------ | --------------------------------------- |
| POST        | `/auth/register`                                                         | Sign up (profile created by DB trigger) |
| POST        | `/auth/login` · `/auth/logout`                                           | Session                                 |
| POST        | `/auth/forgot-password` · `/auth/reset-password`                         | Password reset (Supabase flow)          |
| GET         | `/office-locations`                                                      | Offices for the registration form       |
| POST        | `/attendance/clock-in` · `/attendance/clock-out` · `/attendance/recover` | Attendance RPCs                         |
| GET         | `/attendance/history`                                                    | Paginated history                       |
| PATCH       | `/profile` · POST `/profile/change-password`                             | Profile name / password                 |
| GET · PATCH | `/settings`                                                              | Theme + notifications preference        |

## Environment (`.env.example` → `.env.local`, git-ignored)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — browser-safe (RLS-enforced)
- `SUPABASE_SECRET_KEY` — server-only, **not required for MVP** (reserved)
- `GOOGLE_MAPS_KEY` — reserved for a future map feature (unused)

## Scripts

`npm run dev` · `build` · `start` · `lint` · `typecheck` · `format` / `format:check`.
Pre-commit: husky + lint-staged (`eslint --fix` + `prettier`).

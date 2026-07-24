# ClockUp — Project Structure

Gamified employee work-hours tracking platform (v1.1). This document describes
the **current** implementation. The canonical product/design spec lives in `/docs`
(PRD, FSD, BRD, UFD, DDD, ASD, TADG, DSD, DRPG); the engineering decisions behind
this implementation are recorded in [`/docs/adr`](./docs/adr/) (ADR-001…009). The
v1.1 Time Credits feature is specified by **ADR-009** (source of truth).

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
- **CQRS separation** — the Time Credits read path (presentation service + settlement-read repository, over the `v_attendance_settlement` / `v_time_credit_balance` views) is kept distinct from the write path (redemption service → redemption RPCs).
- **Repositories** take a `SupabaseClient`, select explicit columns, and map `snake_case → camelCase` at the boundary (each has a `Row` type + `toDomain`). No `select("*")` anywhere.
- **Route protection** is enforced in `src/proxy.ts` (Next 16 renamed Middleware → Proxy); `/api` routes enforce their own authorization via `getCurrentUser` + RLS.
- **Tamper-proofing**: attendance timing, points, credit earning, and redemption settlement are computed exclusively by SECURITY DEFINER RPCs that derive identity server-side (`auth.uid()`); clients only supply GPS coordinates and requested amounts. Credit ledger writes happen only inside those RPCs (the direct `add_time_credit` / `consume_time_credit` helpers are not callable by clients — see the security migrations).

## Directory map (`src/`, 163 files, ~8,500 LOC)

```
app/
  (auth)/                      login, register, forgot-password, reset-password (+ layout)
  (dashboard)/                 authenticated shell (layout + template page-transition)
    dashboard|attendance|leaderboard|profile|settings/   page + loading + error
  api/v1/                      18 route handlers (auth, attendance, office-locations, profile,
                               settings, dashboard, credits, redemption)
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
  credits/                     api, schemas, lib/redemption-view, components (time-credits-section, today-credits-card, credit-balance-card, redeem-card, redeem-dialog, redemption-status-badge)  ← Time Credits UI (flag-gated)
  dashboard/                   components (welcome, working-hours, points, weekly summary, quick actions, leaderboard preview, recent attendance, dashboard-card, stat, progress ring/bar, live-working-hours, greeting, status badge/card)
  leaderboard/                 components (table, tabs, summary, pagination)
  profile/                     api, schemas, components (header, personal-info, edit-name dialog, attendance-stats, password-card)
  settings/                    api, schemas, use-theme-preference, components (appearance, notifications, account, app-info, security, theme-sync)
lib/
  api/                         fetch-json (client), response (server envelope)
  flags.ts                     server-only feature flags (ENABLE_TIME_CREDITS, ENABLE_CREDIT_REDEMPTION)
  supabase/                    config, server, session
  utils.ts                     cn()
repositories/                  attendance, leaderboard, office-locations, points, redemption, settings, settlement-read, stats, users
services/                      attendance, auth, dashboard, leaderboard, office, presentation, profile, redemption, settings, types
types/                         api (ApiResponse), domain (camelCase models)
utils/                         format (presentation helpers)
proxy.ts                       route protection (Next 16 proxy)
```

## Database (`supabase/migrations/`)

Applied in order (timestamped). Migrations 1–8 are the v1.0 baseline; 9–16 add
Time Credits + the flat-100 points model; 17–18 are the v1.1 security hardening.

1. `enums` — `attendance_status`, `theme`
2. `core_tables` — `office_locations`, `users`, `attendance`, `points_ledger`, `notifications`, `user_settings`, `holidays`
3. `row_level_security` — RLS enabled + own-row policies on every table
4. `views` — `v_user_stats`, `v_week_summary`, `v_leaderboard` (security_invoker)
5. `seed_office_locations` — default office
6. `handle_new_user` — trigger creating `users` + `user_settings` atomically on signup
7. `attendance_functions` — `clock_in`, `clock_out`, `recover_missed_clock_out`, `geo_distance_meters`, `points_for_minutes` (SECURITY DEFINER)
8. `leaderboard_function` — `get_leaderboard(period)`
9. `time_credit_ledger` — `credit_entry_type` enum, `time_credit_ledger` table, `v_time_credit_balance` view, credit RPCs
10. `time_credit_earning` — award credits at clock-out (earned-once partial unique index); `clock_out`/`recover` gain `p_award_credits`
11. `credit_redemption_infra` — `credit_policy`, `redemption_status`, `time_credit_redemption` (holds), redemption RPCs; balance view extended with reserved/available
12. `fix_redemption_variable_conflict` — bug-fix in `create_or_update_redemption`
13. `flat_points_model` — `points_for_minutes` → flat 100 at goal; historical points normalized (overtime bonus removed)
14. `rename_daily_points` — `calculate_daily_points` (flat); drop `points_for_minutes`
15. `settlement_integration` — `settle_attendance_day` (redemption consume + Counted Time + flat points + earned credits, one atomic transaction; used-once index); `clock_out`/`recover` gain `p_enable_redemption`
16. `read_settlement_view` — `v_attendance_settlement` (per-day read model)
17. `revoke_credit_rpc_grants` — **security**: revoke direct `EXECUTE` on `add_time_credit` / `consume_time_credit` from `authenticated` + `public`
18. `revoke_credit_rpc_grants_anon` — **security**: also revoke from `anon` (only the internal earning/settlement path may write the ledger)

## Feature flags (`src/lib/flags.ts`, server-only)

Both default **off**; when off, the app behaves exactly like v1.0. Read from the
environment at request time, so rollout/rollback is an env change + restart.

| Flag                       | When on                                                                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `ENABLE_TIME_CREDITS`      | Credits earned for time worked past the daily goal; dashboard shows Counted Time, credit balances, and the extended attendance history |
| `ENABLE_CREDIT_REDEMPTION` | Reserve/redeem credits against an open day; settled at clock-out (the Redeem Credits card + write routes become active)                |

## API surface (`/api/v1`, standard `ApiResponse` envelope)

See [`docs/API.md`](./docs/API.md) for the full reference (request/response
shapes). Credit/redemption endpoints below are inert unless the flags are on.

| Method      | Path                                                                     | Purpose                                                                 |
| ----------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| POST        | `/auth/register`                                                         | Sign up (profile created by DB trigger)                                 |
| POST        | `/auth/login` · `/auth/logout`                                           | Session                                                                 |
| POST        | `/auth/forgot-password` · `/auth/reset-password`                         | Password reset (Supabase flow)                                          |
| GET         | `/office-locations`                                                      | Offices for the registration form                                       |
| POST        | `/attendance/clock-in` · `/attendance/clock-out` · `/attendance/recover` | Attendance RPCs                                                         |
| GET         | `/attendance/history`                                                    | Paginated history                                                       |
| PATCH       | `/profile` · POST `/profile/change-password`                             | Profile name / password                                                 |
| GET · PATCH | `/settings`                                                              | Theme + notifications preference                                        |
| GET         | `/dashboard/today`                                                       | Today's summary read model (Counted Time, points, earned)               |
| GET         | `/credits/summary`                                                       | Credit balance read model (earned/used/balance/reserved/available)      |
| GET         | `/redemption/today`                                                      | Today's redemption read model (requested/applied/shortfall/recommended) |
| POST        | `/redemption` · `/redemption/cancel`                                     | Create/adjust or cancel today's redemption hold                         |

## Environment (`.env.example` → `.env.local`, git-ignored)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — browser-safe (RLS-enforced)
- `SUPABASE_SECRET_KEY` — server-only, **not required** (reserved; the app relies on RLS + SECURITY DEFINER RPCs per ADR-005)
- `GOOGLE_MAPS_KEY` — reserved for a future map feature (unused)
- `ENABLE_TIME_CREDITS`, `ENABLE_CREDIT_REDEMPTION` — feature flags (default off)

## Scripts

`npm run dev` · `build` · `start` · `lint` · `typecheck` · `format` / `format:check`.
Pre-commit: husky + lint-staged (`eslint --fix` + `prettier`).

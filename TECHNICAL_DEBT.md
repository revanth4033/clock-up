# ClockUp — Technical Debt

Code-level debt as of v1.0.0, ranked. None of these block the release; they are
the maintainability backlog. Items resolved during the production-readiness pass
are listed at the bottom.

## Medium — worth doing in v1.1

### 1. Timezone handling is UTC-only

`src/services/dashboard.service.ts`, `src/services/leaderboard.service.ts`, and the
attendance RPCs derive "today" from UTC. Add a `timezone` column to
`office_locations` and convert day boundaries per office. Touches the attendance
functions and the two services.

### 2. No observability on route handlers

`src/app/api/v1/**` have no structured logging, request IDs, or error tracking
(only `console.error` in services). Add a thin logging wrapper / error reporter
at the API boundary. The build validator flags this on every route.

### 3. Service return contract is not uniform

Mutations return `ServiceResult<T>`; reads (`getSettings`, `getProfileData`,
`getDashboardData`, `getLeaderboard`, `getOfficeLocations`) return raw
domain objects or `null`. Consequence: `office-locations/route.ts` needs a
special try/catch and `settings/route.ts` hand-maps `null → AUTH_REQUIRED`.
Either adopt `ServiceResult` for reads too, or document the split as intentional
(currently the latter).

### 4. Duplicated error-mapping strategies

Three separate mappers: HTTP-status map (`src/lib/api/response.ts`), Supabase
auth-message substring matching (`src/services/auth.service.ts`,
`profile.service.ts`), and Postgres-exception string matching
(`src/services/attendance.service.ts`). The substring matching is brittle across
Supabase versions. Consolidate into one error-mapping module.

## Low — nice to have

### 5. Shared presentational components live inside `features/dashboard`

`dashboard-card`, `stat`, and `attendance-status-badge` are imported by the
settings/profile/attendance features. They belong in `src/components/`. Also
invert two shell→feature imports: `components/layout/user-menu.tsx` →
`features/auth/api`, and `components/theme/theme-toggle.tsx` →
`features/settings/use-theme-preference`.

### 6. Duplicated pagination component

`features/attendance/components/history-pagination.tsx` and
`features/leaderboard/components/leaderboard-pagination.tsx` are near-identical
(same layout/clamping, only the `href` builder differs). Extract one
`<Pagination page totalPages hrefFor={fn} />`.

### 7. Duplicated per-request date/points helpers

"UTC today" and "sum points since timestamp" logic is repeated between
`dashboard.service.ts` and `leaderboard.service.ts`. Extract `utcDateString()`
and `sumPointsSince(rows, ms)` helpers.

### 8. Registration office picker uses a native `<select>`

`features/auth/components/register-form.tsx` hand-copies the `Input` class onto a
native `<select>` instead of using the Base UI `Select` primitive. Functional and
accessible, but visually inconsistent (no chevron/hover/dark states). Migrate to
`Select` (needs RHF `Controller`) — deliberately deferred from v1.0 to avoid
destabilizing registration at release time.

### 9. `v_leaderboard` read from two repositories

`stats.repository.ts` (`getLeaderboardTop`, dashboard preview) and
`leaderboard.repository.ts` (`getMyRank`) both read the view. Consider
consolidating leaderboard reads into `leaderboard.repository.ts`.

### 10. Minor duplication / granularity

- Two tiny `Row` helpers (`account-card.tsx`, `app-info-card.tsx`) differ only in
  `truncate` vs `tabular-nums`; could share one with a prop.
- Overlapping types `LeaderboardEntry` vs `LeaderboardRow` (`types/domain.ts`) —
  the latter is a superset; could unify via `Pick`.
- `detectMissedClockOuts` (`attendance.service.ts`) is a one-line pass-through.

## Accessibility polish (Low)

- The theme segmented control (`features/settings/components/appearance-card.tsx`)
  exposes `role="radiogroup"` but lacks ArrowLeft/Right roving tabindex; it is
  Tab+Enter operable. Either add roving keys or drop the radio roles.
- Leaderboard medal colors (`utils/format.ts#rankMedalClass`) use raw palette
  values (`text-amber-500` / `text-slate-400` / `text-orange-400`) — the silver is
  low-contrast. Consider `--gold/--silver/--bronze` tokens.

## Resolved in the v1.0 production-readiness pass

- ✅ Open-redirect on login hardened (rejects `//` and `/\`).
- ✅ Raw Supabase error messages no longer leaked to clients (password paths).
- ✅ `getSettings` cached (removed duplicate `/settings` query).
- ✅ framer-motion removed (page transition → CSS); `shadcn` moved to devDeps.
- ✅ Deleted dead files: `empty-page`, unused `select`/`separator` primitives,
  unused browser Supabase client.
- ✅ Extracted shared `lib/api/fetch-json.ts` (was duplicated in 4 `api.ts` files).
- ✅ De-duplicated `initialsOf` and the leaderboard medal-color helper.
- ✅ Added `attendance/error.tsx`; page-title heading font; SR `h1`s on
  Dashboard/Settings.

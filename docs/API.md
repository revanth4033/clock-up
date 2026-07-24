# ClockUp — HTTP API Reference (`/api/v1`)

Current for **v1.1.0**. This is the implementation reference for the routes under
`src/app/api/v1/**`. The design-time spec is `docs/API Specification Document
(ASD).rtf`; where they differ, this document reflects what actually ships.

## Response envelope

Every route returns the `ApiResponse<T>` envelope (`src/types/api.ts`):

```jsonc
// success
{ "success": true,  "message": "…", "data": { /* T */ } }
// error
{ "success": false, "message": "…", "error": { "code": "…", "details": { /* optional */ } } }
```

Error `code` → HTTP status is mapped in `src/lib/api/response.ts` (e.g.
`INVALID_REQUEST` → 400, `AUTH_REQUIRED` → 401, `OUTSIDE_GEOFENCE` → 422,
`RATE_LIMITED` → 429, `SERVER_ERROR` → 500). Clients branch on `success`.

## Authentication

Session is cookie-based (`@supabase/ssr`). Protected routes resolve the caller via
`getCurrentUser()` and return `AUTH_REQUIRED` when there is no session. All
database access runs under Row-Level Security scoped to the caller. Public routes:
`/auth/*` and `GET /office-locations` (needed before sign-in).

## Auth

| Method | Path                    | Body                                            | Success `data` |
| ------ | ----------------------- | ----------------------------------------------- | -------------- |
| POST   | `/auth/register`        | `{ fullName, employeeId, officeEmail, password, designation, officeLocationId }` | `null` |
| POST   | `/auth/login`           | `{ officeEmail, password }`                     | `null`         |
| POST   | `/auth/logout`          | —                                               | `null`         |
| POST   | `/auth/forgot-password` | `{ officeEmail }`                               | `null`         |
| POST   | `/auth/reset-password`  | `{ password }`                                  | `null`         |

## Reference data

| Method | Path                 | Success `data`                                        |
| ------ | -------------------- | ----------------------------------------------------- |
| GET    | `/office-locations`  | `OfficeLocation[]` (id, officeName, lat, lng, radius) |

## Attendance

| Method | Path                       | Body                                    | Success `data`                                     |
| ------ | -------------------------- | --------------------------------------- | -------------------------------------------------- |
| POST   | `/attendance/clock-in`     | `{ latitude, longitude, accuracy }`     | `null`                                             |
| POST   | `/attendance/clock-out`    | `{ latitude, longitude, accuracy }`     | `{ workedMinutes, extraMinutes, pointsEarned }`    |
| POST   | `/attendance/recover`      | `{ attendanceId, clockOut }`            | `{ workedMinutes, extraMinutes, pointsEarned }`    |
| GET    | `/attendance/history?page` | —                                       | `{ records: HistoryRecord[], page, totalPages, total, officeName }` |

Geofence, one-per-day, and timing rules are enforced by the RPCs (`OUTSIDE_GEOFENCE`,
`ALREADY_CLOCKED_IN`, `NOT_CLOCKED_IN`, …). Clients supply GPS only.

## Profile & Settings

| Method | Path                        | Body                                          | Success `data`                     |
| ------ | --------------------------- | --------------------------------------------- | ---------------------------------- |
| PATCH  | `/profile`                  | `{ fullName }`                                | `null`                             |
| POST   | `/profile/change-password`  | `{ currentPassword, newPassword, confirmPassword }` | `null` (current pw re-verified) |
| GET    | `/settings`                 | —                                             | `{ theme, notificationsEnabled }`  |
| PATCH  | `/settings`                 | `{ theme? , notificationsEnabled? }`          | updated settings                   |

## Time Credits (v1.1 — flag-gated)

Read routes reflect the flag state (empty/`none` when off); the write routes are
inert (`FEATURE_DISABLED`) unless `ENABLE_CREDIT_REDEMPTION` is on. All are
auth-scoped. Values come from the `v_attendance_settlement` / `v_time_credit_balance`
read models — no business logic in the routes.

| Method | Path                  | Body                       | Success `data` |
| ------ | --------------------- | -------------------------- | -------------- |
| GET    | `/dashboard/today`    | —                          | `TodaySummary` — `{ status, clockIn, workedMinutes, redeemedCredits, countedMinutes, points, earnedCredits, goalMinutes, goalProgress }` (goal progress uses **Counted Time**) |
| GET    | `/credits/summary`    | —                          | `CreditSummary` — `{ totalEarned, totalUsed, currentBalance, reserved, available, todayRedemptionStatus }` |
| GET    | `/redemption/today`   | —                          | `TodayRedemption` — `{ requestedCredits, appliedCredits, status, remainingShortfall, recommendedRedemption }` |
| POST   | `/redemption`         | `{ requestedCredits }` (positive integer) | `{ redemptionId, requestedCredits, availableBalance }` — creates/adjusts today's hold |
| POST   | `/redemption/cancel`  | —                          | `{ availableBalance }` — cancels today's pending hold |

The write routes are **pure transport**: they validate request shape + auth and
delegate to the redemption service → RPC, which owns every business rule
(minimum-work, shortfall, available-balance, day-open). Redemption status values:
`pending` · `applied` · `released` · `cancelled` · `none`.

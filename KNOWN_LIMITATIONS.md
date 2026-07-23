# ClockUp — Known Limitations (v1.0.0)

These are **intentional scope boundaries** of the MVP, not bugs. Each notes the
impact and the intended resolution. See `TECHNICAL_DEBT.md` for code-level debt.

## Product scope (deferred by design, per `/docs`)

| Limitation                | Detail                                                                                                                                                                         | Impact                                              | Planned      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------ |
| **Notification delivery** | The Settings notifications toggle persists intent (`user_settings.notifications_enabled`), but no notifications are actually sent. Delivery is a P2/Future feature in the FSD. | Users can set the preference; nothing is delivered. | v1.1+        |
| **Avatar upload**         | Avatars render as initials only. No Supabase Storage bucket / upload flow.                                                                                                     | No profile photos.                                  | Future       |
| **Holidays**              | A `holidays` table exists (schema only) but is not used in any calculation.                                                                                                    | Working-day math counts every day.                  | Future       |
| **Analytics / reports**   | Weekly summary / monthly report / charts beyond the dashboard are out of MVP scope.                                                                                            | No historical analytics views.                      | Future       |
| **Offline clock in/out**  | Clocking requires connectivity (approved decision).                                                                                                                            | No offline queueing.                                | Out of scope |
| **Multi-office / admin**  | No admin UI to manage offices, users, or holidays; one seeded office. Office edits are done in the DB.                                                                         | Ops must use SQL/Supabase.                          | Future       |

## Technical limitations

| Limitation                     | Detail                                                                                                                                              | Impact                                                                                    | Planned                                                 |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Timezone is UTC**            | Attendance dates and "today" boundaries use UTC (`toISOString().slice(0,10)`), not a per-office timezone.                                           | Day rollover is at UTC midnight, not local; edge cases near midnight for non-UTC offices. | v1.1 — add an office `timezone` column and convert.     |
| **Theme sync cost**            | The authenticated shell reads `user_settings` on each navigation to feed cross-device theme hydration (one indexed, cached, parallel query).        | Negligible per-page query; a brief theme flash on a brand-new device's first load.        | v1.1 — SSR theme via cookie removes both.               |
| **Leaderboard pagination**     | The leaderboard RPC returns the full ranked list; pagination is applied in JS.                                                                      | Fine for a team; O(all users) per view at large scale.                                    | v1.1 — push LIMIT/OFFSET into the RPC.                  |
| **Missed clock-out detection** | Detected on the user's next login (no cron/scheduler).                                                                                              | A forgotten clock-out is only surfaced when the user returns.                             | Approved decision; revisit with a scheduler.            |
| **No observability**           | Route handlers have no structured logging / error tracking (only `console.error` in services).                                                      | Harder production debugging.                                                              | v1.1 — add a logging wrapper (see `TECHNICAL_DEBT.md`). |
| **Signup Select control**      | The registration office picker uses a native `<select>` (accessible, functional) rather than the styled Base UI `Select` (no custom chevron/hover). | Cosmetic inconsistency on one page.                                                       | v1.1 polish.                                            |

## Dependency advisories (dev/build only)

`npm audit` reports 6 advisories (4 moderate, 2 high). **All are in dev/build
tooling transitive dependencies with no production-runtime exposure:**

- `sharp` / `postcss` — bundled by Next.js (image optimizer / CSS tool). The app
  processes no untrusted images. The suggested "fix" downgrades to `next@9`
  (unacceptable); these resolve via a routine Next patch upgrade.
- `@hono/node-server` — a transitive dependency of the `shadcn` **CLI** (now in
  `devDependencies`), used only for scaffolding, never shipped. The advisory is a
  Windows-only `serve-static` path traversal in the CLI's MCP feature.

`npm audit fix --force` is **not** safe here (it would break the framework and
CLI). Track upstream Next/shadcn releases instead.

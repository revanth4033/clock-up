# ADR-006 — Theme Persistence

**Status:** Accepted (2026-07-23, settings milestone).

## Context

ClockUp supports Light / Dark / System themes. `next-themes` handles applying a
theme (setting the `class` on `<html>`, honoring the OS preference, avoiding a
flash) and persists the choice to `localStorage`. But `localStorage` is
per-device: a user who picks Dark on their laptop would see Light on a new browser
or phone. The Settings requirement (and DDD) is that the theme is a **persisted
user preference** (`user_settings.theme`) that follows the user, while still
integrating cleanly with `next-themes` for the actual application of the theme.

The hard part is avoiding divergence between three places a theme can be set or
read: the header toggle, the Settings control, and the database.

## Decision

Treat the **database as the source of truth for the preference** and `next-themes`
as the fast local applier, connected by two pieces:

1. **A single write-path hook — `useThemePreference`.** `selectTheme(t)` calls
   `next-themes` `setTheme(t)` (applies instantly, no flash) **and** fires a
   best-effort `PATCH /api/v1/settings` to persist `theme`. **Both** the header
   `ThemeToggle` and the Settings `AppearanceCard` go through this hook, so the DB
   and `localStorage` never diverge on a device, and there is exactly one place
   that writes a theme change.
2. **A reconciler — `ThemeSync`.** Mounted once in the authenticated shell layout
   (which already resolves `getSettings()` in parallel with the user), it runs a
   single ref-guarded effect: if the persisted DB theme differs from the theme
   `next-themes` restored from `localStorage`, it calls `setTheme(dbTheme)`. This
   seeds the saved theme on a fresh device/browser (empty `localStorage`) and then
   never fights later user changes (it runs once).

The Settings control seeds its selected state from the DB value (server-rendered),
so a reload always shows the persisted preference. Persistence is best-effort:
theme is low-stakes, so a failed PATCH still applies locally and never blocks the
UI or surfaces an error.

## Alternatives Considered

1. **`next-themes` only (localStorage).** Simplest, but not cross-device and not a
   real account preference — fails the requirement. Rejected.
2. **DB only, ignore next-themes.** We'd re-implement flash-free application, OS
   `system` handling, and SSR theming that next-themes already does well.
   Rejected.
3. **SSR the theme from a cookie** (server sets `<html class>` from a theme
   cookie). This is the "ideal" for zero-flash cross-device, but requires wiring
   next-themes to cookies and adds server coupling. Deferred — the current
   approach meets the requirement with one cached query; the cookie path is
   recorded as a v1.1 optimization (KNOWN_LIMITATIONS).

## Consequences

**Positive**

- Theme is a true account preference: it persists and **follows the user across
  devices** (verified in a fresh-context e2e).
- One write-path means the header and Settings never disagree with the DB.
- No flash on the normal (returning-device) path; `getSettings` is `cache()`d so
  the layout + Settings page share one read.

**Negative / costs**

- The shell reads `user_settings` on each authenticated navigation to feed
  `ThemeSync` (one indexed, cached, parallel query — negligible).
- A brand-new device shows a one-time reconciliation flash (localStorage empty →
  seed DB theme).

## Future Considerations

- Move to cookie-based SSR theming to remove both the per-page query and the
  first-load flash. This is the single clean upgrade for this subsystem.

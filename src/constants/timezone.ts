/**
 * Application display timezone. Every user-facing wall-clock time and date is
 * formatted in this zone so rendering is IDENTICAL on the server (Vercel's
 * runtime is UTC) and the client, and independent of the host's system
 * timezone. Override per-deployment with `NEXT_PUBLIC_APP_TIMEZONE`
 * (public — it is read in both server and client components).
 *
 * Historical bug: without an explicit zone, `Intl.DateTimeFormat` used the
 * runtime timezone — IST in local dev, UTC on Vercel — so clock-in/out times
 * rendered 5h30m early in production.
 */
export const APP_TIME_ZONE =
  process.env.NEXT_PUBLIC_APP_TIMEZONE || "Asia/Kolkata";

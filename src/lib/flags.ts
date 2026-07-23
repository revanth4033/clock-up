import "server-only";

/**
 * Server-only feature flags. These are read at request time from the
 * environment, so a flag can be flipped by changing the deploy env and
 * restarting — no code or database change — enabling safe rollout / rollback.
 */

/**
 * Time Credits earning (Phase 3). When false (the default), the app behaves
 * exactly like v1.0: clock-out awards points only. When true, a completed day
 * ALSO earns Time Credits, in the same atomic transaction. Redemption is a
 * separate, later phase and is unaffected by this flag.
 */
export const ENABLE_TIME_CREDITS = process.env.ENABLE_TIME_CREDITS === "true";

/**
 * Time Credit redemption (Phase 4B+). When false (the default), the redemption
 * subsystem is dormant — the app behaves exactly as today. When true, the
 * redemption service endpoints become available. It does NOT by itself change
 * attendance, points, or clock-out; settlement is a separate later phase.
 */
export const ENABLE_CREDIT_REDEMPTION =
  process.env.ENABLE_CREDIT_REDEMPTION === "true";

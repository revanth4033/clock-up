/**
 * Resolved Supabase connection config, shared by the browser and server clients.
 *
 * Uses the publishable key (`sb_publishable_…`), which is browser-safe — Row
 * Level Security enforces access. Never put a secret key in a NEXT_PUBLIC_
 * variable.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

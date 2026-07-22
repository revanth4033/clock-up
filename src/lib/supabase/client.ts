import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

/**
 * Supabase client for use in Client Components (browser).
 *
 * Uses only the public publishable/anon key. All privileged access goes through
 * the server (route handlers / services) and is enforced by Row Level Security.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

/**
 * Supabase client for use in Server Components, Route Handlers, and Server
 * Actions. Reads and writes the auth session via Next.js cookies.
 *
 * `cookies()` is async in Next.js, so this function must be awaited.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // `setAll` was called from a Server Component. This can be ignored
          // when session refresh is handled by middleware (added in Phase 5).
        }
      },
    },
  });
}

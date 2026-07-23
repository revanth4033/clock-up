import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

// Next.js 16 Proxy (formerly Middleware). Runs on the Node.js runtime.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on everything except static assets; the handler skips /api internally.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

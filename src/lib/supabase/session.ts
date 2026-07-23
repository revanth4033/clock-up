import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];
const AUTH_PAGES = ["/login", "/register"];

function isPublicPath(path: string) {
  if (path.startsWith("/auth")) return true; // /auth/callback (email links)
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

function copyCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

/**
 * Refreshes the Supabase session on every request and enforces route access:
 *  - unauthenticated + protected route   -> redirect to /login (with ?redirect)
 *  - authenticated    + /login|/register -> redirect to /dashboard
 * API routes are only refreshed; they enforce their own authorization.
 *
 * Called from the Next.js Proxy (src/proxy.ts).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (path.startsWith("/api")) return response;

  if (!user && !isPublicPath(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (path !== "/") url.searchParams.set("redirect", path);
    return copyCookies(NextResponse.redirect(url), response);
  }

  if (user && AUTH_PAGES.includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return copyCookies(NextResponse.redirect(url), response);
  }

  return response;
}

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Keeps the Supabase session cookie fresh and bounces signed-out visitors
 * away from /admin.
 *
 * This is a convenience layer, not the security boundary. Membership of
 * `admin_users` is verified in the admin layout, and row level security
 * enforces it again on every query. That matters here, because refreshing
 * the session needs a network call to Supabase — and middleware runs on
 * every single admin request.
 *
 * A slow response from that call used to take the whole dashboard down with
 * MIDDLEWARE_INVOCATION_TIMEOUT. So the call is now raced against a short
 * deadline: if it does not answer in time we fall back to checking whether
 * a session cookie is present at all, and let the layout make the real
 * decision. Worst case someone is asked to sign in again — never a 504.
 */

const AUTH_DEADLINE_MS = 3_000;

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  // Recovery links land on /auth/callback, which is outside this matcher,
  // but the page it forwards to must stay reachable while signed in.
  const isPasswordReset = pathname === "/admin/reset-password";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const signedIn = await isSignedIn(supabase, request);

  if (!isLogin && !isPasswordReset && !signedIn) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/admin/login";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  if (isLogin && signedIn) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/admin";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}

/**
 * Ask Supabase, but never wait longer than the deadline. On timeout or
 * error, fall back to whether a session cookie exists — the layout will
 * validate it properly a moment later.
 */
async function isSignedIn(
  supabase: ReturnType<typeof createServerClient>,
  request: NextRequest,
): Promise<boolean> {
  const timeout = new Promise<"timeout">((resolve) =>
    setTimeout(() => resolve("timeout"), AUTH_DEADLINE_MS),
  );

  try {
    const result = await Promise.race([supabase.auth.getUser(), timeout]);

    if (result === "timeout") {
      console.warn("[middleware] auth check timed out; falling back to cookie");
      return hasSessionCookie(request);
    }

    return Boolean(result.data.user);
  } catch (error) {
    console.error("[middleware] auth check failed", error);
    return hasSessionCookie(request);
  }
}

/** Supabase stores the session as `sb-<ref>-auth-token`, sometimes chunked. */
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(({ name, value }) => name.startsWith("sb-") && name.includes("auth-token") && value);
}

export const config = {
  matcher: ["/admin/:path*"],
};

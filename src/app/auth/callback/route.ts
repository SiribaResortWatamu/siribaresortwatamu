import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Where Supabase sends people back to after a magic link, an invite or a
 * password recovery email.
 *
 * Two link shapes reach here depending on how the email was generated, so
 * both are handled:
 *   ?code=…                  an OAuth/PKCE style exchange
 *   ?token_hash=…&type=…     the email OTP verification used by Supabase's
 *                            own templates
 *
 * Either way the session cookie is set on the server before any page
 * renders, so the dashboard sees a signed-in user immediately.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "") as EmailOtpType | "";
  const requested = searchParams.get("next") ?? "";

  // Only same-site admin paths are honoured, so this cannot become an
  // open redirect.
  const next = requested.startsWith("/admin") ? requested : null;

  const supabase = await createSupabaseServerClient();
  let failed: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) failed = error.message;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) failed = error.message;
  } else {
    failed =
      searchParams.get("error_description") ?? "That link is missing its token.";
  }

  if (failed) {
    return NextResponse.redirect(
      `${origin}/admin/login?error=${encodeURIComponent(
        "That link has expired or has already been used. Please request a new one.",
      )}`,
    );
  }

  const destination =
    next ?? (type === "recovery" ? "/admin/reset-password" : "/admin");

  return NextResponse.redirect(`${origin}${destination}`);
}

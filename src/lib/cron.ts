import "server-only";
import { NextResponse } from "next/server";
import { cronSecret } from "@/lib/env";

/**
 * Scheduled jobs are reachable over HTTP, so they must prove they were
 * invoked by the scheduler. Vercel Cron sends `Authorization: Bearer
 * $CRON_SECRET`; the same header works for any other scheduler, or for a
 * manual run with curl.
 *
 * Returns a response when the caller should be rejected, or null to proceed.
 */
export function rejectUnauthorisedCron(request: Request): NextResponse | null {
  const secret = cronSecret();

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on this deployment." },
      { status: 503 },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!timingSafeEqual(provided, secret)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  return null;
}

/** Constant-time comparison so the secret cannot be guessed byte by byte. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

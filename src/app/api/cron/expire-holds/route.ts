import { NextResponse } from "next/server";
import { rejectUnauthorisedCron } from "@/lib/cron";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Releases temporary holds the owner never confirmed, so the dates go back
 * on sale automatically. The work is done by `expire_stale_holds()` in the
 * database, which keeps the rule next to the constraint that enforces it.
 */
export async function GET(request: Request) {
  const rejected = rejectUnauthorisedCron(request);
  if (rejected) return rejected;

  const { data, error } = await supabaseAdmin().rpc("expire_stale_holds");

  if (error) {
    console.error("[cron] expire holds failed", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const expired = Number(data ?? 0);
  if (expired > 0) console.info(`[cron] released ${expired} expired hold(s)`);

  return NextResponse.json({ ok: true, expired });
}

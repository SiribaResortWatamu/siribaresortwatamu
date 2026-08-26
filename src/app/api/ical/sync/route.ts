import { NextResponse } from "next/server";
import { syncAllApartmentCalendars } from "@/lib/ical-sync";

// Triggered by Vercel Cron (see vercel.json) on a schedule, or can be called
// manually with the same bearer token for testing. Not admin-session-gated
// since Vercel Cron can't carry a browser session — a shared secret is the
// standard pattern for authenticating scheduled/webhook-style requests.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await syncAllApartmentCalendars();
  return NextResponse.json({ synced: results.length, results });
}

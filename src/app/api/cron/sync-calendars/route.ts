import { NextResponse } from "next/server";
import { rejectUnauthorisedCron } from "@/lib/cron";
import { syncAllApartments } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Pulls Airbnb and Booking.com reservations into our availability. */
export async function GET(request: Request) {
  const rejected = rejectUnauthorisedCron(request);
  if (rejected) return rejected;

  const started = Date.now();
  const results = await syncAllApartments();

  const summary = {
    apartments: results.length,
    imported: results.reduce((n, r) => n + r.imported, 0),
    removed: results.reduce((n, r) => n + r.removed, 0),
    // Imported entries that lost to a confirmed direct booking.
    skipped: results.reduce((n, r) => n + r.skipped, 0),
    errors: results.flatMap((r) => r.errors.map((e) => `${r.apartmentName}: ${e}`)),
    ms: Date.now() - started,
  };

  console.info("[cron] calendar sync", summary);

  return NextResponse.json({ ok: true, ...summary, results });
}

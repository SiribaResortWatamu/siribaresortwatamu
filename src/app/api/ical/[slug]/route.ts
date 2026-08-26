import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildIcalFeed, type IcalEvent } from "@/lib/ical";

type Params = Promise<{ slug: string }>;

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Public, unauthenticated feed by design — this is exactly what Airbnb/
// Booking.com's "import calendar from URL" expects to poll periodically.
// Only date ranges + a generic label are exposed, never guest name/email/
// phone — those live in `bookings`, which this deliberately doesn't select.
export async function GET(_request: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: apartment } = await supabase
    .from("apartments")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();

  if (!apartment) {
    return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
  }

  const [{ data: bookings }, { data: blocked }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, arrival, departure")
      .eq("apartment_id", apartment.id)
      .neq("status", "cancelled"),
    supabase
      .from("blocked_dates")
      .select("id, start_date, end_date")
      .or(`apartment_id.eq.${apartment.id},apartment_id.is.null`),
  ]);

  const events: IcalEvent[] = [
    ...(bookings ?? []).map((b) => ({
      uid: `booking-${b.id}@siribaresort`,
      startDate: b.arrival,
      endDate: b.departure, // already exclusive (checkout day)
      summary: "Reserved",
    })),
    ...(blocked ?? []).map((b) => ({
      uid: `block-${b.id}@siribaresort`,
      startDate: b.start_date,
      endDate: addDays(b.end_date, 1), // stored inclusive, iCal DTEND is exclusive
      summary: "Unavailable",
    })),
  ];

  const feed = buildIcalFeed(`${apartment.name} — Siriba Resort`, events);

  return new NextResponse(feed, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${slug}.ics"`,
      "Cache-Control": "public, max-age=1800", // 30 min — matches typical external poll cadence
    },
  });
}

import { NextResponse } from "next/server";
import { format, subMonths } from "date-fns";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { buildIcalFeed, type IcalExportEvent } from "@/lib/ical";
import type { Apartment, BlockedDate, Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Public availability feed for one apartment.
 *
 * The URL carries an unguessable per-apartment token rather than the id, so
 * it can be pasted into Airbnb or Booking.com without exposing anything
 * else. Only dates are published — never a guest's name or contact details.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const db = supabaseAdmin();

  const { data: apartmentRow } = await db
    .from("apartments")
    .select("*")
    .eq("ical_export_token", token)
    .maybeSingle();

  const apartment = apartmentRow as Apartment | null;
  if (!apartment) {
    return new NextResponse("Not found", { status: 404 });
  }

  // A little history keeps channel managers happy without bloating the feed.
  const from = format(subMonths(new Date(), 2), "yyyy-MM-dd");

  const [{ data: bookingRows }, { data: blockRows }] = await Promise.all([
    db
      .from("bookings")
      .select("id, check_in, check_out, booking_status, booking_reference, source")
      .eq("apartment_id", apartment.id)
      .in("booking_status", ["pending", "held", "confirmed", "completed"])
      .gte("check_out", from)
      .order("check_in"),
    db
      .from("blocked_dates")
      .select("id, start_date, end_date, reason, source, note")
      .eq("apartment_id", apartment.id)
      .gte("end_date", from)
      .order("start_date"),
  ]);

  const events: IcalExportEvent[] = [
    ...((bookingRows as Booking[]) ?? []).map((booking) => ({
      uid: `booking-${booking.id}@siribaresort`,
      start: booking.check_in,
      end: booking.check_out,
      summary: "Reserved",
      description: `Direct booking ${booking.booking_reference}`,
    })),
    ...((blockRows as BlockedDate[]) ?? []).map((block) => ({
      uid: `block-${block.id}@siribaresort`,
      start: block.start_date,
      end: block.end_date,
      summary: block.reason === "maintenance" ? "Maintenance" : "Not available",
      description: block.note ?? undefined,
    })),
  ];

  const body = buildIcalFeed(`${apartment.name} — Availability`, events);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${apartment.slug}.ics"`,
      // Channel managers poll this; a few minutes of caching is plenty.
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}

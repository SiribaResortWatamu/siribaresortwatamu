import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseIcal } from "@/lib/ical-parser";

export type ExternalCalendar = { label: string; url: string };

export type SyncResult = {
  apartmentId: string;
  source: string;
  eventCount: number;
  error?: string;
};

// `blocked_dates.end_date` is INCLUSIVE (the last unavailable night) —
// that's what every reader assumes: the export route in
// app/api/ical/[slug] adds a day to turn it back into an exclusive DTEND,
// and BookingWidget disables through it. Parsed iCal events carry an
// EXCLUSIVE end (RFC 5545 DTEND = the checkout day, which is bookable
// again), so the boundary has to be converted here rather than leaving two
// different meanings in the same column.
function exclusiveEndToInclusive(startDate: string, endDate: string): string {
  const [y, m, d] = endDate.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
  // A zero-length event would shift to before its own start and trip the
  // end_after_start check constraint — clamp it to a single blocked night.
  return shifted < startDate ? startDate : shifted;
}

// Pulls one external calendar (Airbnb/Booking.com "export" URL) and
// upserts it into blocked_dates, keyed by (apartment_id, external_uid) so
// re-running is idempotent. Removes any previously-synced block from this
// same source that's no longer present upstream (the guest cancelled, or
// the listing owner unblocked it on the other platform).
export async function syncOneCalendar(
  apartmentId: string,
  calendar: ExternalCalendar
): Promise<SyncResult> {
  const admin = createAdminClient();

  let events;
  try {
    const res = await fetch(calendar.url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const text = await res.text();
    events = parseIcal(text);
  } catch (err) {
    return {
      apartmentId,
      source: calendar.label,
      eventCount: 0,
      error: err instanceof Error ? err.message : "Failed to fetch/parse calendar",
    };
  }

  const seenUids = events.map((e) => e.uid);

  for (const event of events) {
    await admin.from("blocked_dates").upsert(
      {
        apartment_id: apartmentId,
        start_date: event.start,
        end_date: exclusiveEndToInclusive(event.start, event.end),
        reason: `Synced from ${calendar.label}`,
        external_uid: event.uid,
        external_source: calendar.label,
      },
      { onConflict: "apartment_id,external_uid" }
    );
  }

  // Clean up blocks from this source that disappeared from the upstream feed.
  let deleteQuery = admin
    .from("blocked_dates")
    .delete()
    .eq("apartment_id", apartmentId)
    .eq("external_source", calendar.label);

  deleteQuery = seenUids.length > 0 ? deleteQuery.not("external_uid", "in", `(${seenUids.join(",")})`) : deleteQuery;
  await deleteQuery;

  return { apartmentId, source: calendar.label, eventCount: events.length };
}

export async function syncApartmentCalendars(apartmentId: string): Promise<SyncResult[]> {
  const admin = createAdminClient();
  const { data: apartment } = await admin
    .from("apartments")
    .select("external_ical_urls")
    .eq("id", apartmentId)
    .maybeSingle();

  const calendars = (apartment?.external_ical_urls ?? []) as ExternalCalendar[];
  const results: SyncResult[] = [];
  for (const calendar of calendars) {
    results.push(await syncOneCalendar(apartmentId, calendar));
  }
  return results;
}

export async function syncAllApartmentCalendars(): Promise<SyncResult[]> {
  const admin = createAdminClient();
  const { data: apartments } = await admin
    .from("apartments")
    .select("id, external_ical_urls")
    .eq("is_archived", false);

  const results: SyncResult[] = [];
  for (const apartment of apartments ?? []) {
    const calendars = (apartment.external_ical_urls ?? []) as ExternalCalendar[];
    for (const calendar of calendars) {
      results.push(await syncOneCalendar(apartment.id, calendar));
    }
  }
  return results;
}

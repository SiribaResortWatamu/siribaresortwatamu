import "server-only";
import { format, startOfDay, subDays } from "date-fns";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fetchIcalEvents } from "@/lib/ical";
import type { Apartment, BlockSource } from "@/lib/types";

/**
 * Pull external reservations into `blocked_dates`.
 *
 * Two rules, both enforced in the database rather than here:
 *   - an imported block that overlaps a live direct booking is dropped
 *     (the `blocked_dates_respect_bookings` trigger returns NULL for
 *     non-admin sources), so a sync can never bury a confirmed stay;
 *   - a booking can never be created over a block.
 */

export interface SyncResult {
  apartmentId: string;
  apartmentName: string;
  imported: number;
  removed: number;
  skipped: number;
  errors: string[];
}

const CHANNELS: { field: keyof Apartment; source: BlockSource; label: string }[] = [
  { field: "airbnb_ical_url", source: "airbnb", label: "Airbnb" },
  { field: "booking_com_ical_url", source: "booking_com", label: "Booking.com" },
];

export async function syncApartment(apartment: Apartment): Promise<SyncResult> {
  const db = supabaseAdmin();
  const result: SyncResult = {
    apartmentId: apartment.id,
    apartmentName: apartment.name,
    imported: 0,
    removed: 0,
    skipped: 0,
    errors: [],
  };

  // Past blocks are left alone — they are history, not availability.
  const horizon = format(subDays(startOfDay(new Date()), 1), "yyyy-MM-dd");

  for (const channel of CHANNELS) {
    const url = apartment[channel.field] as string | null;
    if (!url) continue;

    const events = await fetchIcalEvents(url);
    if (events === null) {
      result.errors.push(`${channel.label}: feed could not be read`);
      continue;
    }

    const seenUids: string[] = [];

    for (const event of events) {
      const start = format(event.start, "yyyy-MM-dd");
      const end = format(event.end, "yyyy-MM-dd");
      if (end <= horizon) continue; // entirely in the past

      seenUids.push(event.uid);

      // Match the existing row by hand rather than upserting.
      //
      // The unique index this would need to conflict against is partial —
      // `(apartment_id, source, external_uid) where external_uid is not
      // null` — and Postgres will not infer a partial index from an ON
      // CONFLICT target unless the predicate is restated, which PostgREST
      // gives us no way to send. The upsert that used to be here therefore
      // failed with 42P10 on every single row and imported nothing, while
      // still reporting a successful sync.
      const { data: existing, error: lookupError } = await db
        .from("blocked_dates")
        .select("id, start_date, end_date")
        .eq("apartment_id", apartment.id)
        .eq("source", channel.source)
        .eq("external_uid", event.uid)
        .maybeSingle();

      if (lookupError) {
        result.errors.push(`${channel.label}: ${lookupError.message}`);
        continue;
      }

      if (existing) {
        // Already held on the same nights, so there is nothing to write.
        if (existing.start_date === start && existing.end_date === end) {
          result.imported += 1;
          continue;
        }

        // The reservation moved. Delete and re-insert rather than update,
        // so the `before insert` booking guard still gets to veto it.
        const { error: deleteError } = await db
          .from("blocked_dates")
          .delete()
          .eq("id", existing.id);

        if (deleteError) {
          result.errors.push(`${channel.label}: ${deleteError.message}`);
          continue;
        }
      }

      const { data, error } = await db
        .from("blocked_dates")
        .insert({
          apartment_id: apartment.id,
          start_date: start,
          end_date: end,
          reason: "external_ical",
          source: channel.source,
          note: `${channel.label}: ${event.summary}`,
          external_uid: event.uid,
        })
        .select("id");

      if (error) {
        result.errors.push(`${channel.label}: ${error.message}`);
      } else if (!data || data.length === 0) {
        // The guard trigger dropped it: a direct booking owns these nights.
        result.skipped += 1;
      } else {
        result.imported += 1;
      }
    }

    // Anything this channel no longer lists has been cancelled on their side.
    const { data: stale } = await db
      .from("blocked_dates")
      .select("id, external_uid")
      .eq("apartment_id", apartment.id)
      .eq("source", channel.source)
      .gte("end_date", horizon);

    const toRemove = (stale ?? [])
      .filter((row) => row.external_uid && !seenUids.includes(row.external_uid))
      .map((row) => row.id);

    if (toRemove.length > 0) {
      const { error } = await db.from("blocked_dates").delete().in("id", toRemove);
      if (error) {
        result.errors.push(`${channel.label}: ${error.message}`);
      } else {
        result.removed += toRemove.length;
      }
    }
  }

  // Only stamp a clean run. Updating this unconditionally is what let a
  // sync that imported nothing at all keep reporting a healthy timestamp
  // on the calendar page, which is why this went unnoticed.
  if (result.errors.length === 0) {
    await db
      .from("apartments")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", apartment.id);
  }

  return result;
}

/** Sync every apartment that has at least one external calendar configured. */
export async function syncAllApartments(): Promise<SyncResult[]> {
  const { data } = await supabaseAdmin()
    .from("apartments")
    .select("*")
    .neq("status", "archived")
    .or("airbnb_ical_url.not.is.null,booking_com_ical_url.not.is.null");

  const apartments = (data as Apartment[]) ?? [];
  const results: SyncResult[] = [];

  // Sequential on purpose: these are third-party endpoints and a small
  // property has a handful of listings, not hundreds.
  for (const apartment of apartments) {
    results.push(await syncApartment(apartment));
  }

  return results;
}

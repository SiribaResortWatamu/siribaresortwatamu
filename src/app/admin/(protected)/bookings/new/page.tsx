import { format } from "date-fns";
import { PageHeader } from "@/components/admin/ui";
import {
  NewBookingForm,
  type UnavailablePeriod,
} from "@/components/admin/new-booking-form";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Apartment } from "@/lib/types";

export const metadata = { title: "New Booking" };

// Availability has to reflect the sync that ran a moment ago, never a
// cached copy of the page.
export const dynamic = "force-dynamic";

export default async function NewBookingPage() {
  const db = supabaseAdmin();
  const today = format(new Date(), "yyyy-MM-dd");

  const [{ data }, { data: bookingRows }, { data: blockRows }] = await Promise.all([
    db
      .from("apartments")
      .select("*")
      .neq("status", "archived")
      .order("display_order")
      .order("name"),
    db
      .from("bookings")
      .select("apartment_id, check_in, check_out, booking_reference, guest_name_snapshot")
      .in("booking_status", ["pending", "held", "confirmed", "completed"])
      .gt("check_out", today),
    db
      .from("blocked_dates")
      .select("apartment_id, start_date, end_date, source, reason, note")
      .gt("end_date", today),
  ]);

  const unavailable: Record<string, UnavailablePeriod[]> = {};

  const add = (apartmentId: string | null, period: UnavailablePeriod) => {
    if (!apartmentId) return;
    (unavailable[apartmentId] ??= []).push(period);
  };

  for (const row of bookingRows ?? []) {
    add(row.apartment_id as string | null, {
      start: row.check_in as string,
      end: row.check_out as string,
      label: `${row.booking_reference} — ${row.guest_name_snapshot}`,
      kind: "booking",
    });
  }

  for (const row of blockRows ?? []) {
    const source = row.source as string;
    add(row.apartment_id as string | null, {
      start: row.start_date as string,
      end: row.end_date as string,
      label:
        (row.note as string | null) ??
        (row.reason as string | null) ??
        "Blocked",
      kind:
        source === "airbnb" || source === "booking_com" ? "channel" : "block",
    });
  }

  for (const list of Object.values(unavailable)) {
    list.sort((a, b) => a.start.localeCompare(b.start));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New booking"
        subtitle="For reservations taken by phone, WhatsApp or in person."
        back={{ href: "/admin/bookings", label: "Bookings" }}
      />
      <NewBookingForm
        apartments={(data as Apartment[]) ?? []}
        unavailable={unavailable}
      />
    </div>
  );
}

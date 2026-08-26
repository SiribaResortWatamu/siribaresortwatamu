import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookingRequestSchema } from "@/lib/validation";
import { sendBookingNotification } from "@/lib/email";

// Postgres exclusion-constraint violation (see no_overlapping_bookings in
// supabase/migrations/0001_init.sql).
const EXCLUSION_VIOLATION = "23P01";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bookingRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const supabase = createAdminClient();

  // Server always recomputes price from the DB — the client's number is
  // never trusted (this is the fix for the old Firebase system, where a
  // client could submit any totalPrice/status directly).
  const { data: apartment, error: apartmentError } = await supabase
    .from("apartments")
    .select("id, name, price_usd, is_archived")
    .eq("id", input.apartmentId)
    .maybeSingle();

  if (apartmentError) {
    return NextResponse.json({ error: "Could not look up apartment" }, { status: 500 });
  }
  if (!apartment || apartment.is_archived) {
    return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
  }

  const nights = Math.round(
    (new Date(input.departure).getTime() - new Date(input.arrival).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const totalPriceUsd = nights * apartment.price_usd;

  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert({
      apartment_id: apartment.id,
      guest_name: input.guestName,
      guest_email: input.guestEmail,
      guest_phone: input.guestPhone || null,
      arrival: input.arrival,
      departure: input.departure,
      adults: input.adults,
      children: input.children,
      price_per_night_usd: apartment.price_usd,
      total_price_usd: totalPriceUsd,
      special_requests: input.specialRequests || null,
      status: "pending",
      payment_status: "unpaid",
      source: "site",
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === EXCLUSION_VIOLATION) {
      return NextResponse.json(
        { error: "Those dates were just booked for this apartment. Please pick different dates." },
        { status: 409 }
      );
    }
    console.error("Booking insert failed:", insertError);
    return NextResponse.json({ error: "Could not save booking" }, { status: 500 });
  }

  await sendBookingNotification({
    apartmentName: apartment.name,
    guestName: input.guestName,
    guestEmail: input.guestEmail,
    guestPhone: input.guestPhone,
    arrival: input.arrival,
    departure: input.departure,
    nights,
    adults: input.adults,
    children: input.children,
    totalPriceUsd,
    specialRequests: input.specialRequests,
  });

  return NextResponse.json({ id: booking.id, nights, totalPriceUsd }, { status: 201 });
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safariBookingRequestSchema } from "@/lib/validation";
import { sendSafariBookingNotification } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = safariBookingRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid safari enquiry", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const supabase = createAdminClient();

  const { data: safari, error: safariError } = await supabase
    .from("safari_packages")
    .select("id, name, is_archived")
    .eq("id", input.safariPackageId)
    .maybeSingle();

  if (safariError) {
    return NextResponse.json({ error: "Could not look up safari package" }, { status: 500 });
  }
  if (!safari || safari.is_archived) {
    return NextResponse.json({ error: "Safari package not found" }, { status: 404 });
  }

  const { data: booking, error: insertError } = await supabase
    .from("safari_bookings")
    .insert({
      safari_package_id: safari.id,
      safari_name: safari.name,
      guest_name: input.guestName,
      guest_email: input.guestEmail,
      travel_date: input.travelDate || null,
      adults: input.adults,
      children: input.children,
      notes: input.notes || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Safari booking insert failed:", insertError);
    return NextResponse.json({ error: "Could not save enquiry" }, { status: 500 });
  }

  await sendSafariBookingNotification({
    safariName: safari.name,
    guestName: input.guestName,
    guestEmail: input.guestEmail,
    travelDate: input.travelDate,
    adults: input.adults,
    children: input.children,
    notes: input.notes,
  });

  return NextResponse.json({ id: booking.id }, { status: 201 });
}

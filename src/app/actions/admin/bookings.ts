"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { quoteStay, nightsBetween } from "@/lib/pricing";
import { getSettings } from "@/lib/data/settings";
import { sendMail } from "@/lib/email";
import { formatDate, formatMoney } from "@/lib/format";
import { siteUrl } from "@/lib/env";
import { syncAllApartments } from "@/lib/sync";
import type { Apartment, Booking } from "@/lib/types";

/**
 * Booking operations for staff.
 *
 * Pricing is recalculated here on every change rather than trusted from the
 * form, exactly as on the public side. The only figures a member of staff can
 * type directly are the ones that are genuinely manual: a negotiated total,
 * a deposit, and payments received.
 */

const isoDate = z.iso.date("Please choose a valid date");

function textField(value: FormDataEntryValue | null): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function numberField(value: FormDataEntryValue | null, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Turns a database constraint violation into something a person can act on. */
function describeBookingError(error: { code?: string; message: string }): string {
  if (error.code === "23P01") {
    return "Those dates clash with another booking or a blocked period for this accommodation.";
  }
  if (/unavailable for this accommodation/i.test(error.message)) {
    return error.message;
  }
  return error.message;
}

// =====================================================================
// Create (manual / phone / WhatsApp booking)
// =====================================================================
const createSchema = z
  .object({
    apartmentId: z.uuid("Choose an accommodation"),
    checkIn: isoDate,
    checkOut: isoDate,
    guests: z.coerce.number().int().min(1),
    name: z.string().trim().min(2, "Guest name is required"),
    email: z.email("A valid email is required"),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    source: z.enum(["website", "airbnb", "booking_com", "admin", "whatsapp", "other"]),
    bookingStatus: z.enum(["pending", "held", "confirmed"]),
  })
  .refine((v) => nightsBetween(v.checkIn, v.checkOut) >= 1, {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  });

export async function createAdminBooking(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return actionError("Please check the highlighted fields.", fieldErrors);
  }

  const input = parsed.data;
  const db = supabaseAdmin();

  const { data: apartmentRow } = await db
    .from("apartments")
    .select("*")
    .eq("id", input.apartmentId)
    .maybeSingle();

  const apartment = apartmentRow as Apartment | null;
  if (!apartment) return actionError("That accommodation no longer exists.");

  const quote = quoteStay(apartment, input.checkIn, input.checkOut);

  // Staff may override the total for a negotiated rate; blank means "use the
  // calculated figure", and a typed figure is still bounded by the server.
  const overrideTotal = formData.get("total");
  const total =
    typeof overrideTotal === "string" && overrideTotal.trim()
      ? Math.max(0, numberField(overrideTotal))
      : quote.total;

  const depositField = formData.get("deposit");
  const deposit =
    typeof depositField === "string" && depositField.trim()
      ? Math.max(0, numberField(depositField))
      : quote.depositRequired;

  const guest = await upsertGuest({
    name: input.name,
    email: input.email,
    phone: input.phone || null,
  });

  const { data, error } = await db
    .from("bookings")
    .insert({
      guest_id: guest,
      apartment_id: apartment.id,
      apartment_name_snapshot: apartment.name,
      guest_name_snapshot: input.name,
      guest_email_snapshot: input.email.toLowerCase(),
      guest_phone_snapshot: input.phone || null,
      check_in: input.checkIn,
      check_out: input.checkOut,
      guests_count: input.guests,
      rate_snapshot: quote.rate,
      cleaning_fee_snapshot: quote.cleaningFee,
      total_snapshot: total,
      currency: quote.currency,
      deposit_required: deposit,
      amount_paid: Math.max(0, numberField(formData.get("amountPaid"))),
      booking_status: input.bookingStatus,
      source: input.source,
      notes: textField(formData.get("notes")),
      special_requests: textField(formData.get("specialRequests")),
      confirmed_at: input.bookingStatus === "confirmed" ? new Date().toISOString() : null,
    })
    .select("id, booking_reference")
    .single();

  if (error) return actionError(describeBookingError(error));

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");
  revalidatePath(`/accommodation/${apartment.slug}`);

  redirect(`/admin/bookings/${data.id}?created=1`);
}

// =====================================================================
// Update an existing booking
// =====================================================================
export async function updateBooking(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return actionError("Unknown booking.");

  const db = supabaseAdmin();
  const { data: existingRow } = await db
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const existing = existingRow as Booking | null;
  if (!existing) return actionError("That booking no longer exists.");

  const checkIn = String(formData.get("checkIn") ?? existing.check_in);
  const checkOut = String(formData.get("checkOut") ?? existing.check_out);

  if (nightsBetween(checkIn, checkOut) < 1) {
    return actionError("Check-out must be after check-in.", {
      checkOut: "Must be after check-in",
    });
  }

  // Re-price from the apartment whenever the dates move, unless staff have
  // set an explicit total.
  const { data: apartmentRow } = await db
    .from("apartments")
    .select("*")
    .eq("id", existing.apartment_id ?? "")
    .maybeSingle();

  const apartment = apartmentRow as Apartment | null;
  const datesChanged = checkIn !== existing.check_in || checkOut !== existing.check_out;

  const overrideTotal = formData.get("total");
  const hasOverride = typeof overrideTotal === "string" && overrideTotal.trim() !== "";

  let total = existing.total_snapshot;
  let rate = existing.rate_snapshot;
  let cleaning = existing.cleaning_fee_snapshot;

  if (hasOverride) {
    total = Math.max(0, numberField(overrideTotal));
  } else if (datesChanged && apartment) {
    const quote = quoteStay(apartment, checkIn, checkOut);
    total = quote.total;
    rate = quote.rate;
    cleaning = quote.cleaningFee;
  }

  const { error } = await db
    .from("bookings")
    .update({
      check_in: checkIn,
      check_out: checkOut,
      guests_count: Math.max(1, numberField(formData.get("guests"), existing.guests_count)),
      rate_snapshot: rate,
      cleaning_fee_snapshot: cleaning,
      total_snapshot: total,
      deposit_required: Math.max(0, numberField(formData.get("deposit"))),
      special_requests: textField(formData.get("specialRequests")),
      notes: textField(formData.get("notes")),
      guest_phone_snapshot: textField(formData.get("phone")),
    })
    .eq("id", id);

  if (error) return actionError(describeBookingError(error));

  revalidatePath(`/admin/bookings/${id}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");

  return actionSuccess("Booking updated");
}

// =====================================================================
// Status changes
// =====================================================================
export async function setBookingStatus(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = z
    .enum(["pending", "held", "confirmed", "cancelled", "completed", "no_show"])
    .safeParse(formData.get("status"));

  if (!id || !status.success) return;

  const db = supabaseAdmin();
  const now = new Date().toISOString();

  const patch: Record<string, unknown> = { booking_status: status.data };
  if (status.data === "confirmed") {
    patch.confirmed_at = now;
    patch.hold_expires_at = null; // a confirmed booking is no longer a hold
  }
  if (status.data === "cancelled") patch.cancelled_at = now;

  const { data } = await db
    .from("bookings")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  const booking = data as Booking | null;

  if (booking && (status.data === "confirmed" || status.data === "cancelled")) {
    await notifyGuestOfStatus(booking, status.data);
  }

  revalidatePath(`/admin/bookings/${id}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
}

async function notifyGuestOfStatus(booking: Booking, status: "confirmed" | "cancelled") {
  const settings = await getSettings();

  const rows = [
    { label: "Reference", value: booking.booking_reference },
    { label: "Accommodation", value: booking.apartment_name_snapshot },
    { label: "Check-in", value: formatDate(booking.check_in) },
    { label: "Check-out", value: formatDate(booking.check_out) },
    { label: "Guests", value: String(booking.guests_count) },
    {
      label: "Total",
      value: formatMoney(booking.total_snapshot, booking.currency),
    },
  ];

  if (status === "confirmed") {
    await sendMail({
      to: booking.guest_email_snapshot,
      subject: `Your booking is confirmed — ${booking.booking_reference}`,
      heading: "Your booking is confirmed",
      intro: `Wonderful — your stay at Siriba Resort Watamu is confirmed. We look forward to welcoming you.`,
      rows: [
        ...rows,
        ...(booking.deposit_required > 0 && booking.amount_paid < booking.deposit_required
          ? [
              {
                label: "Deposit due",
                value: formatMoney(booking.deposit_required, booking.currency),
              },
            ]
          : []),
        ...(booking.balance > 0
          ? [
              {
                label: "Balance on arrival",
                value: formatMoney(booking.balance, booking.currency),
              },
            ]
          : []),
      ],
      body: [
        `Check-in is from ${settings?.check_in_time ?? "14:00"} and check-out is by ${settings?.check_out_time ?? "10:00"}.`,
        "We will send arrival directions a few days before you travel. If you need a transfer from the airport, just reply and we will arrange it.",
      ],
      cta: { label: "Plan your trip", href: `${siteUrl()}/safaris` },
    });
  } else {
    await Promise.allSettled([
      sendMail({
        to: booking.guest_email_snapshot,
        subject: `Your booking has been cancelled — ${booking.booking_reference}`,
        heading: "Your booking has been cancelled",
        intro:
          "We are sorry to see this one go. Your booking has been cancelled and the dates released.",
        rows,
        body: [
          "If a refund is due under our cancellation policy, we will process it to the account the payment came from.",
          "If this was not what you intended, reply to this email and we will put it right.",
        ],
      }),
      settings?.owner_email
        ? sendMail({
            to: settings.owner_email,
            subject: `Booking cancelled — ${booking.booking_reference}`,
            heading: "Booking cancelled",
            intro: `${booking.guest_name_snapshot}'s booking for ${booking.apartment_name_snapshot} has been cancelled.`,
            rows,
          })
        : Promise.resolve(),
    ]);
  }
}

// =====================================================================
// Payments
// =====================================================================
export async function recordPayment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return actionError("Unknown booking.");

  const amount = numberField(formData.get("amount"));
  if (amount <= 0) {
    return actionError("Enter the amount received.", { amount: "Must be more than zero" });
  }

  const db = supabaseAdmin();
  const { data: existingRow } = await db
    .from("bookings")
    .select("amount_paid, total_snapshot, currency, booking_reference, guest_email_snapshot, guest_name_snapshot, apartment_name_snapshot")
    .eq("id", id)
    .maybeSingle();

  if (!existingRow) return actionError("That booking no longer exists.");

  const newTotalPaid = Number(existingRow.amount_paid) + amount;

  const { error } = await db
    .from("bookings")
    .update({
      amount_paid: newTotalPaid,
      payment_method: textField(formData.get("method")),
      payment_reference: textField(formData.get("reference")),
      payment_date:
        textField(formData.get("date")) ?? new Date().toISOString().slice(0, 10),
      payment_notes: textField(formData.get("notes")),
    })
    .eq("id", id);

  if (error) return actionError(`Could not record the payment: ${error.message}`);

  const currency = String(existingRow.currency);
  const balance = Number(existingRow.total_snapshot) - newTotalPaid;

  if (formData.get("sendReceipt") === "on") {
    await sendMail({
      to: String(existingRow.guest_email_snapshot),
      subject: `Payment received — ${existingRow.booking_reference}`,
      heading: "Thank you, we have your payment",
      intro: `We have received ${formatMoney(amount, currency)} towards your stay.`,
      rows: [
        { label: "Reference", value: String(existingRow.booking_reference) },
        { label: "Accommodation", value: String(existingRow.apartment_name_snapshot) },
        { label: "Amount received", value: formatMoney(amount, currency) },
        { label: "Paid to date", value: formatMoney(newTotalPaid, currency) },
        {
          label: "Balance",
          value: balance > 0 ? formatMoney(balance, currency) : "Settled in full",
        },
      ],
    });
  }

  revalidatePath(`/admin/bookings/${id}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");

  return actionSuccess("Payment recorded", {
    detail:
      balance > 0
        ? `${formatMoney(balance, currency)} still outstanding.`
        : "This booking is paid in full.",
  });
}

/** Manual override for cases the derived status cannot express, e.g. a refund. */
export async function setPaymentStatus(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = z
    .enum(["unpaid", "deposit_required", "partially_paid", "paid", "refunded"])
    .safeParse(formData.get("paymentStatus"));

  if (!id || !status.success) return;

  await supabaseAdmin()
    .from("bookings")
    .update({ payment_status: status.data })
    .eq("id", id);

  revalidatePath(`/admin/bookings/${id}`);
  revalidatePath("/admin/bookings");
}

// =====================================================================
// Blocked dates
// =====================================================================
export async function createBlock(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const start = String(formData.get("startDate") ?? "");
  const end = String(formData.get("endDate") ?? "");

  if (!start || !end || end <= start) {
    return actionError("The end date must be after the start date.", {
      endDate: "Must be after the start date",
    });
  }

  const reason = z
    .enum(["maintenance", "owner_stay", "private_event", "other"])
    .safeParse(formData.get("reason"));

  // "Entire property" fans out to one block per apartment, so each one still
  // gets checked against its own bookings.
  const apartmentIds = formData.getAll("apartmentIds").map(String).filter(Boolean);
  if (apartmentIds.length === 0) {
    return actionError("Choose at least one accommodation to block.");
  }

  const db = supabaseAdmin();
  const conflicts: string[] = [];
  let created = 0;

  for (const apartmentId of apartmentIds) {
    const { error } = await db.from("blocked_dates").insert({
      apartment_id: apartmentId,
      start_date: start,
      end_date: end,
      reason: reason.success ? reason.data : "other",
      source: "admin",
      note: textField(formData.get("note")),
    });

    if (error) {
      const { data } = await db
        .from("apartments")
        .select("name")
        .eq("id", apartmentId)
        .maybeSingle();
      conflicts.push(`${data?.name ?? "Accommodation"}: ${error.message}`);
    } else {
      created += 1;
    }
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/accommodation");

  if (conflicts.length > 0 && created === 0) {
    return actionError(conflicts.join(" "));
  }
  if (conflicts.length > 0) {
    return actionSuccess(`Blocked ${created} of ${apartmentIds.length}`, {
      detail: conflicts.join(" "),
    });
  }

  return actionSuccess(
    created === 1 ? "Dates blocked" : `Dates blocked for ${created} apartments`,
  );
}

export async function deleteBlock(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabaseAdmin().from("blocked_dates").delete().eq("id", id);

  revalidatePath("/admin/calendar");
  revalidatePath("/accommodation");
}

// =====================================================================
// Housekeeping
// =====================================================================
export async function setHousekeeping(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const housekeeping = z
    .enum(["available", "occupied", "cleaning", "ready", "maintenance"])
    .safeParse(formData.get("housekeeping"));

  if (!id || !housekeeping.success) return;

  await supabaseAdmin()
    .from("apartments")
    .update({ housekeeping: housekeeping.data })
    .eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/admin/accommodation");
}

// =====================================================================
// Manual calendar sync
// =====================================================================
export async function syncCalendarsNow(): Promise<void> {
  await requireAdmin();

  const results = await syncAllApartments();
  console.info("[admin] manual calendar sync", results);

  revalidatePath("/admin/calendar");
  revalidatePath("/admin/accommodation");
}

// ---------------------------------------------------------------------
async function upsertGuest(input: {
  name: string;
  email: string;
  phone: string | null;
}): Promise<string | null> {
  const db = supabaseAdmin();
  const email = input.email.trim().toLowerCase();

  const { data: existing } = await db
    .from("guests")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data } = await db
    .from("guests")
    .insert({ name: input.name, email, phone: input.phone })
    .select("id")
    .single();

  return (data?.id as string) ?? null;
}

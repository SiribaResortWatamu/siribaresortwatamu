"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addHours, formatISO } from "date-fns";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/data/settings";
import { quoteStay, quoteTransfer, nightsBetween } from "@/lib/pricing";
import { sendMail } from "@/lib/email";
import { formatDate, formatMoney } from "@/lib/format";
import { siteUrl } from "@/lib/env";
import type { ActionState } from "@/lib/action-state";
import type { Apartment, Guest, SafariPackage, TransferService } from "@/lib/types";

/**
 * Public form submissions.
 *
 * Every one of these runs on the server with the service-role client. Prices,
 * totals and availability are derived here from the stored record — the form
 * only ever supplies dates, counts and contact details.
 */

// ---------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------
const contact = {
  name: z.string().trim().min(2, "Please give your full name").max(120),
  email: z.email("Please check your email address"),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(40).optional().or(z.literal("")),
};

const isoDate = z.iso.date("Please choose a valid date");

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function fail(message: string, errors?: Record<string, string>): ActionState {
  return { status: "error", message, fieldErrors: errors };
}

/** One guest record per email address, so history follows the person. */
async function upsertGuest(input: {
  name: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
}): Promise<Guest | null> {
  const db = supabaseAdmin();
  const email = input.email.trim().toLowerCase();

  const { data: existing } = await db
    .from("guests")
    .select("*")
    .ilike("email", email)
    .maybeSingle();

  if (existing) {
    const patch: Record<string, string> = {};
    if (input.phone && !existing.phone) patch.phone = input.phone;
    if (input.whatsapp && !existing.whatsapp) patch.whatsapp = input.whatsapp;
    if (Object.keys(patch).length) {
      await db.from("guests").update(patch).eq("id", existing.id);
    }
    return existing as Guest;
  }

  const { data } = await db
    .from("guests")
    .insert({
      name: input.name,
      email,
      phone: input.phone || null,
      whatsapp: input.whatsapp || null,
    })
    .select("*")
    .single();

  return (data as Guest) ?? null;
}

// =====================================================================
// Accommodation booking
// =====================================================================
const bookingSchema = z
  .object({
    apartmentId: z.uuid("Unknown accommodation"),
    checkIn: isoDate,
    checkOut: isoDate,
    guests: z.coerce.number().int().min(1, "At least one guest"),
    specialRequests: z.string().trim().max(2000).optional().or(z.literal("")),
    ...contact,
  })
  .refine((v) => nightsBetween(v.checkIn, v.checkOut) >= 1, {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  });

export async function createBooking(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail("Please check the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;
  const db = supabaseAdmin();

  // The apartment is the single source of truth for price and capacity.
  const { data: apartmentRow } = await db
    .from("apartments")
    .select("*")
    .eq("id", input.apartmentId)
    .eq("status", "published")
    .maybeSingle();

  const apartment = apartmentRow as Apartment | null;
  if (!apartment) {
    return fail("That accommodation is no longer available to book.");
  }

  const quote = quoteStay(apartment, input.checkIn, input.checkOut);

  if (input.guests > apartment.max_guests) {
    return fail(`${apartment.name} sleeps up to ${apartment.max_guests} guests.`, {
      guests: `Maximum ${apartment.max_guests} guests`,
    });
  }

  if (quote.nights < apartment.min_nights) {
    return fail(`${apartment.name} has a minimum stay of ${apartment.min_nights} nights.`, {
      checkOut: `Minimum ${apartment.min_nights} nights`,
    });
  }

  // Release any hold that has run out before looking at availability.
  // The exclusion constraint cannot judge this itself — its predicate must
  // be immutable, so it counts every 'held' row regardless of the clock.
  // Doing it here means an abandoned hold frees its dates on the next
  // booking attempt rather than waiting for the nightly sweep.
  await db.rpc("expire_stale_holds");

  // Advisory check for a clean error message. The database constraint below
  // is what actually guarantees no double booking under concurrency.
  const { data: available } = await db.rpc("is_apartment_available", {
    p_apartment_id: apartment.id,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
  });
  if (available === false) {
    return fail("Those dates have just been taken. Please choose different dates.");
  }

  const settings = await getSettings();
  const holdHours = settings?.hold_duration_hours ?? 0;
  const holdExpiresAt =
    holdHours > 0 ? formatISO(addHours(new Date(), holdHours)) : null;

  const guest = await upsertGuest(input);

  const { data: bookingRow, error } = await db
    .from("bookings")
    .insert({
      guest_id: guest?.id ?? null,
      apartment_id: apartment.id,
      apartment_name_snapshot: apartment.name,
      guest_name_snapshot: input.name,
      guest_email_snapshot: input.email.toLowerCase(),
      guest_phone_snapshot: input.phone || input.whatsapp || null,
      check_in: input.checkIn,
      check_out: input.checkOut,
      guests_count: input.guests,
      rate_snapshot: quote.rate,
      cleaning_fee_snapshot: quote.cleaningFee,
      total_snapshot: quote.total,
      currency: quote.currency,
      deposit_required: quote.depositRequired,
      booking_status: holdExpiresAt ? "held" : "pending",
      hold_expires_at: holdExpiresAt,
      source: "website",
      special_requests: input.specialRequests || null,
    })
    .select("booking_reference")
    .single();

  if (error) {
    // 23P01 = exclusion_violation: someone booked those nights first.
    if (error.code === "23P01" || /unavailable|overlap/i.test(error.message)) {
      return fail("Those dates have just been taken. Please choose different dates.");
    }
    console.error("[booking] insert failed", error);
    return fail("We could not save your booking. Please try again or send us a WhatsApp.");
  }

  const reference = bookingRow!.booking_reference as string;

  await notifyBooking({
    reference,
    apartmentName: apartment.name,
    guestName: input.name,
    guestEmail: input.email,
    guestPhone: input.phone || input.whatsapp || "—",
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nights: quote.nights,
    guests: input.guests,
    total: formatMoney(quote.total, quote.currency),
    deposit: formatMoney(quote.depositRequired, quote.currency),
    specialRequests: input.specialRequests || undefined,
    ownerEmail: settings?.owner_email ?? settings?.email ?? null,
    notifyOwner: settings?.notify_on_booking ?? true,
    holdHours: holdExpiresAt ? holdHours : 0,
  });

  revalidatePath(`/accommodation/${apartment.slug}`);
  revalidatePath("/admin");

  return {
    status: "success",
    message: "Booking request received",
    reference,
    detail: holdExpiresAt
      ? `We have put ${formatDate(input.checkIn)} – ${formatDate(input.checkOut)} on hold for ${holdHours} hours while we confirm.`
      : `We will confirm ${formatDate(input.checkIn)} – ${formatDate(input.checkOut)} shortly.`,
  };
}

async function notifyBooking(b: {
  reference: string;
  apartmentName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  total: string;
  deposit: string;
  specialRequests?: string;
  ownerEmail: string | null;
  notifyOwner: boolean;
  holdHours: number;
}) {
  const rows = [
    { label: "Reference", value: b.reference },
    { label: "Accommodation", value: b.apartmentName },
    { label: "Check-in", value: formatDate(b.checkIn) },
    { label: "Check-out", value: formatDate(b.checkOut) },
    { label: "Nights", value: String(b.nights) },
    { label: "Guests", value: String(b.guests) },
    { label: "Total", value: b.total },
    { label: "Deposit to confirm", value: b.deposit },
  ];

  const tasks: Promise<unknown>[] = [
    sendMail({
      to: b.guestEmail,
      subject: `We have your booking request — ${b.reference}`,
      heading: "Thank you, we have your request",
      intro: `Hello ${b.guestName.split(" ")[0]}, thank you for choosing Siriba Resort Watamu. Your request is with us and we will confirm it shortly.`,
      rows,
      body: b.holdHours
        ? [
            `We have placed these dates on hold for ${b.holdHours} hours while we confirm availability. Nothing is charged yet.`,
          ]
        : ["Nothing is charged yet — we will be in touch to confirm and arrange the deposit."],
      cta: { label: "View our apartments", href: `${siteUrl()}/accommodation` },
      footnote: "If anything above is wrong, just reply to this email and we will fix it.",
    }),
  ];

  if (b.notifyOwner && b.ownerEmail) {
    tasks.push(
      sendMail({
        to: b.ownerEmail,
        replyTo: b.guestEmail,
        subject: `New booking request — ${b.apartmentName} — ${b.reference}`,
        heading: "New booking request",
        intro: `${b.guestName} has requested ${b.apartmentName}.`,
        rows: [
          ...rows,
          { label: "Email", value: b.guestEmail },
          { label: "Phone", value: b.guestPhone },
          ...(b.specialRequests
            ? [{ label: "Special requests", value: b.specialRequests }]
            : []),
        ],
        cta: { label: "Open the dashboard", href: `${siteUrl()}/admin/bookings` },
      }),
    );
  }

  await Promise.allSettled(tasks);
}

// =====================================================================
// Safari enquiry
// =====================================================================
const safariSchema = z.object({
  safariId: z.uuid("Unknown safari"),
  travelDate: z.union([isoDate, z.literal("")]).optional(),
  dateFlexible: z.coerce.boolean().optional(),
  adults: z.coerce.number().int().min(1, "At least one adult").max(50),
  children: z.coerce.number().int().min(0).max(50),
  specialRequests: z.string().trim().max(2000).optional().or(z.literal("")),
  ...contact,
});

export async function createSafariEnquiry(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = safariSchema.safeParse({
    ...raw,
    dateFlexible: formData.get("dateFlexible") === "on",
  });
  if (!parsed.success) {
    return fail("Please check the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;
  const db = supabaseAdmin();

  const { data: safariRow } = await db
    .from("safari_packages")
    .select("*")
    .eq("id", input.safariId)
    .eq("status", "published")
    .maybeSingle();

  const safari = safariRow as SafariPackage | null;
  if (!safari) return fail("That safari is no longer available.");

  const guest = await upsertGuest(input);
  const travellers = input.adults + input.children;

  const { data: row, error } = await db
    .from("safari_enquiries")
    .insert({
      safari_id: safari.id,
      safari_name_snapshot: safari.name,
      guest_id: guest?.id ?? null,
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone || null,
      whatsapp: input.whatsapp || null,
      travel_date: input.travelDate || null,
      date_flexible: Boolean(input.dateFlexible),
      adults: input.adults,
      children: input.children,
      travellers,
      special_requests: input.specialRequests || null,
      currency: safari.currency,
    })
    .select("reference")
    .single();

  if (error) {
    console.error("[safari enquiry] insert failed", error);
    return fail("We could not send your enquiry. Please try again or send us a WhatsApp.");
  }

  const reference = row!.reference as string;
  const settings = await getSettings();

  const rows = [
    { label: "Reference", value: reference },
    { label: "Safari", value: safari.name },
    {
      label: "Preferred date",
      value: input.travelDate
        ? `${formatDate(input.travelDate)}${input.dateFlexible ? " (flexible)" : ""}`
        : "Flexible",
    },
    { label: "Travellers", value: `${input.adults} adults, ${input.children} children` },
  ];

  await Promise.allSettled([
    sendMail({
      to: input.email,
      subject: `Your safari enquiry — ${reference}`,
      heading: "Thank you for your safari enquiry",
      intro: `Hello ${input.name.split(" ")[0]}, we have your enquiry for the ${safari.name} and will come back to you with availability and a quote.`,
      rows,
      footnote: "Reply to this email if you would like to change anything.",
    }),
    settings?.notify_on_enquiry && (settings.owner_email ?? settings.email)
      ? sendMail({
          to: (settings.owner_email ?? settings.email)!,
          replyTo: input.email,
          subject: `New safari enquiry — ${safari.name} — ${reference}`,
          heading: "New safari enquiry",
          intro: `${input.name} is asking about the ${safari.name}.`,
          rows: [
            ...rows,
            { label: "Email", value: input.email },
            { label: "Phone", value: input.phone || input.whatsapp || "—" },
            ...(input.specialRequests
              ? [{ label: "Notes", value: input.specialRequests }]
              : []),
          ],
          cta: { label: "Open enquiries", href: `${siteUrl()}/admin/safaris/enquiries` },
        })
      : Promise.resolve(),
  ]);

  revalidatePath("/admin");

  return {
    status: "success",
    message: "Safari enquiry sent",
    reference,
    detail: "We usually reply the same day with availability and a full quote.",
  };
}

// =====================================================================
// Transfer request
// =====================================================================
const transferSchema = z.object({
  transferId: z.uuid("Unknown service"),
  pickupLocation: z.string().trim().min(2, "Where should we collect you?").max(200),
  dropoffLocation: z.string().trim().min(2, "Where are you going?").max(200),
  transferDate: isoDate,
  pickupTime: z.string().trim().max(10).optional().or(z.literal("")),
  passengers: z.coerce.number().int().min(1, "At least one passenger").max(60),
  luggage: z.coerce.number().int().min(0).max(60),
  flightNumber: z.string().trim().max(20).optional().or(z.literal("")),
  trainNumber: z.string().trim().max(20).optional().or(z.literal("")),
  specialInstructions: z.string().trim().max(2000).optional().or(z.literal("")),
  ...contact,
});

export async function createTransferRequest(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = transferSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail("Please check the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;
  const db = supabaseAdmin();

  const { data: serviceRow } = await db
    .from("transfer_services")
    .select("*")
    .eq("id", input.transferId)
    .eq("status", "published")
    .maybeSingle();

  const service = serviceRow as TransferService | null;
  if (!service) return fail("That transfer service is no longer available.");

  if (input.passengers > service.passenger_capacity) {
    return fail(
      `${service.name} carries up to ${service.passenger_capacity} passengers. Tell us in the notes if you need a second vehicle.`,
      { passengers: `Maximum ${service.passenger_capacity} passengers` },
    );
  }

  // Price is computed here, never taken from the form.
  const quote = quoteTransfer(service, { passengers: input.passengers });
  const guest = await upsertGuest(input);

  const { data: row, error } = await db
    .from("transfer_bookings")
    .insert({
      transfer_id: service.id,
      transfer_name_snapshot: service.name,
      guest_id: guest?.id ?? null,
      passenger_name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone || null,
      whatsapp: input.whatsapp || null,
      pickup_location: input.pickupLocation,
      dropoff_location: input.dropoffLocation,
      transfer_date: input.transferDate,
      pickup_time: input.pickupTime || null,
      passengers: input.passengers,
      luggage: input.luggage,
      flight_number: input.flightNumber || null,
      train_number: input.trainNumber || null,
      special_instructions: input.specialInstructions || null,
      pricing_method_snapshot: quote.method,
      unit_price_snapshot: quote.unitPrice,
      price_snapshot: quote.total,
      currency: quote.currency,
    })
    .select("reference")
    .single();

  if (error) {
    console.error("[transfer] insert failed", error);
    return fail("We could not send your request. Please try again or send us a WhatsApp.");
  }

  const reference = row!.reference as string;
  const settings = await getSettings();

  const rows = [
    { label: "Reference", value: reference },
    { label: "Service", value: service.name },
    { label: "Pick-up", value: input.pickupLocation },
    { label: "Drop-off", value: input.dropoffLocation },
    { label: "Date", value: formatDate(input.transferDate) },
    { label: "Time", value: input.pickupTime || "To be confirmed" },
    { label: "Passengers", value: String(input.passengers) },
    {
      label: "Price",
      value: quote.onEnquiry ? "On enquiry" : formatMoney(quote.total, quote.currency),
    },
  ];

  await Promise.allSettled([
    sendMail({
      to: input.email,
      subject: `Your transfer request — ${reference}`,
      heading: "We have your transfer request",
      intro: `Hello ${input.name.split(" ")[0]}, we have your request and will confirm the driver and vehicle shortly.`,
      rows,
      footnote:
        "If your flight or train changes, reply to this email and we will move the pick-up.",
    }),
    settings?.notify_on_transfer && (settings.owner_email ?? settings.email)
      ? sendMail({
          to: (settings.owner_email ?? settings.email)!,
          replyTo: input.email,
          subject: `New transfer request — ${service.name} — ${reference}`,
          heading: "New transfer request",
          intro: `${input.name} needs a ${service.name}.`,
          rows: [
            ...rows,
            { label: "Email", value: input.email },
            { label: "Phone", value: input.phone || input.whatsapp || "—" },
            ...(input.flightNumber ? [{ label: "Flight", value: input.flightNumber }] : []),
            ...(input.trainNumber ? [{ label: "Train", value: input.trainNumber }] : []),
            ...(input.specialInstructions
              ? [{ label: "Instructions", value: input.specialInstructions }]
              : []),
          ],
          cta: { label: "Assign a driver", href: `${siteUrl()}/admin/transfers/requests` },
        })
      : Promise.resolve(),
  ]);

  revalidatePath("/admin");

  return {
    status: "success",
    message: "Transfer request sent",
    reference,
    detail: quote.onEnquiry
      ? "We will come back to you with a price for this journey."
      : `Your driver will be confirmed shortly. Total: ${formatMoney(quote.total, quote.currency)}.`,
  };
}

// =====================================================================
// Contact message
// =====================================================================
const messageSchema = z.object({
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Please tell us a little more").max(4000),
  ...contact,
});

export async function sendContactMessage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Honeypot: real people leave this hidden field empty.
  if (formData.get("company")) {
    return { status: "success", message: "Message sent" };
  }

  const parsed = messageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail("Please check the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const { error } = await supabaseAdmin().from("messages").insert({
    name: input.name,
    email: input.email.toLowerCase(),
    phone: input.phone || null,
    subject: input.subject || null,
    message: input.message,
  });

  if (error) {
    console.error("[message] insert failed", error);
    return fail("We could not send your message. Please try again or send us a WhatsApp.");
  }

  const settings = await getSettings();
  if (settings?.notify_on_message && (settings.owner_email ?? settings.email)) {
    await sendMail({
      to: (settings.owner_email ?? settings.email)!,
      replyTo: input.email,
      subject: `New message from ${input.name}`,
      heading: input.subject || "New website message",
      intro: `${input.name} sent a message through the website.`,
      rows: [
        { label: "Name", value: input.name },
        { label: "Email", value: input.email },
        { label: "Phone", value: input.phone || "—" },
      ],
      body: [input.message],
      cta: { label: "Open messages", href: `${siteUrl()}/admin/messages` },
    });
  }

  revalidatePath("/admin");

  return {
    status: "success",
    message: "Message sent",
    detail: "Thank you — we will get back to you shortly.",
  };
}

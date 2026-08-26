import { NextResponse } from "next/server";
import { addDays, format, subDays } from "date-fns";
import { rejectUnauthorisedCron } from "@/lib/cron";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/data/settings";
import { sendMail } from "@/lib/email";
import { formatDate } from "@/lib/format";
import { siteUrl } from "@/lib/env";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily guest correspondence:
 *   1. close out stays that ended (which also flags the room for cleaning)
 *   2. send arrival information a few days before check-in
 *   3. send a thank-you after departure
 *
 * `guest_message_log` has a unique key on (booking, message type), so a
 * retry or a double-scheduled run can never send the same message twice.
 */
export async function GET(request: Request) {
  const rejected = rejectUnauthorisedCron(request);
  if (rejected) return rejected;

  const db = supabaseAdmin();
  const settings = await getSettings();
  const today = new Date();

  // ---------------------------------------------------------------
  // 1. Complete departed stays
  // ---------------------------------------------------------------
  const { data: completedRows } = await db
    .from("bookings")
    .update({ booking_status: "completed" })
    .eq("booking_status", "confirmed")
    .lt("check_out", format(today, "yyyy-MM-dd"))
    .select("id");

  const completed = completedRows?.length ?? 0;

  // ---------------------------------------------------------------
  // 2. Pre-arrival
  // ---------------------------------------------------------------
  const preArrivalDate = format(
    addDays(today, settings?.pre_arrival_days ?? 3),
    "yyyy-MM-dd",
  );

  const { data: arrivingRows } = await db
    .from("bookings")
    .select("*")
    .eq("booking_status", "confirmed")
    .eq("check_in", preArrivalDate);

  let preArrivalSent = 0;
  for (const booking of (arrivingRows as Booking[]) ?? []) {
    const claimed = await claim(booking.id, "pre_arrival");
    if (!claimed) continue;

    const { sent } = await sendMail({
      to: booking.guest_email_snapshot,
      subject: `Your stay at Siriba Resort — arrival information (${booking.booking_reference})`,
      heading: "We're looking forward to having you",
      intro: `Hello ${firstName(booking.guest_name_snapshot)}, your stay is only a few days away. Here is everything you need for arrival.`,
      rows: [
        { label: "Reference", value: booking.booking_reference },
        { label: "Accommodation", value: booking.apartment_name_snapshot },
        { label: "Check-in", value: formatDate(booking.check_in) },
        { label: "Check-out", value: formatDate(booking.check_out) },
        { label: "Arrive from", value: settings?.check_in_time ?? "14:00" },
        { label: "Depart by", value: settings?.check_out_time ?? "10:00" },
        ...(booking.balance > 0
          ? [
              {
                label: "Balance on arrival",
                value: `${booking.currency} ${booking.balance.toLocaleString()}`,
              },
            ]
          : []),
      ],
      body: [
        settings?.arrival_information ??
          "Send us your arrival time and we will meet you at the gate.",
        settings?.address
          ? `Our address: ${settings.address}`
          : "Message us on WhatsApp if you need directions on the day.",
      ],
      cta: { label: "Get in touch", href: `${siteUrl()}/contact` },
      footnote: "Travelling with anything we should know about? Just reply to this email.",
    });

    if (sent) preArrivalSent += 1;
  }

  // ---------------------------------------------------------------
  // 3. Post-stay
  // ---------------------------------------------------------------
  const postStayDate = format(
    subDays(today, settings?.post_stay_days ?? 1),
    "yyyy-MM-dd",
  );

  const { data: departedRows } = await db
    .from("bookings")
    .select("*")
    .in("booking_status", ["completed", "confirmed"])
    .eq("check_out", postStayDate);

  let postStaySent = 0;
  for (const booking of (departedRows as Booking[]) ?? []) {
    const claimed = await claim(booking.id, "post_stay");
    if (!claimed) continue;

    const { sent } = await sendMail({
      to: booking.guest_email_snapshot,
      subject: "Thank you for staying with us",
      heading: "Thank you for staying with us",
      intro: `Hello ${firstName(booking.guest_name_snapshot)}, thank you for choosing Siriba Resort Watamu. We hope the coast treated you well.`,
      body: [
        "If anything could have been better, we would genuinely like to know — a short reply to this email reaches us directly.",
        settings?.review_url
          ? "If you enjoyed your stay, a review helps a small property like ours more than you might think."
          : "And if you enjoyed it, do tell a friend. Word of mouth is most of how people find us.",
      ],
      cta: settings?.review_url
        ? { label: "Leave a review", href: settings.review_url }
        : { label: "Book again", href: `${siteUrl()}/accommodation` },
      footnote: "You are always welcome back — regulars get our best rates.",
    });

    if (sent) postStaySent += 1;
  }

  const summary = { completed, preArrivalSent, postStaySent };
  console.info("[cron] guest messages", summary);

  return NextResponse.json({ ok: true, ...summary });

  /** Reserve the right to send; false if it already went out. */
  async function claim(bookingId: string, messageType: string): Promise<boolean> {
    const { error } = await db
      .from("guest_message_log")
      .insert({ booking_id: bookingId, message_type: messageType });
    return !error;
  }
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "there";
}

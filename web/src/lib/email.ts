import "server-only";
import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "Siriba Resort <onboarding@resend.dev>";
const TO = process.env.NOTIFICATION_TO_EMAIL;

// Notification emails are best-effort: the Supabase row is already the
// durable record, so a Resend failure logs but never fails the request.
async function sendNotification(subject: string, html: string) {
  if (!TO) {
    console.warn("NOTIFICATION_TO_EMAIL is not set — skipping email notification");
    return;
  }
  try {
    await getResend().emails.send({ from: FROM, to: TO, subject, html });
  } catch (err) {
    console.error("Failed to send notification email:", err);
  }
}

// Guest-supplied values (name, message, etc.) are interpolated into these
// templates — escape them so a crafted submission can't inject markup/links
// into the notification email.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function row(label: string, value: string) {
  return `<tr><td style="padding:4px 12px 4px 0;color:#6b6459;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:4px 0;color:#26241f;font-weight:600;">${escapeHtml(value)}</td></tr>`;
}

export async function sendBookingNotification(booking: {
  apartmentName: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  arrival: string;
  departure: string;
  nights: number;
  adults: number;
  children: number;
  totalPriceUsd: number;
  specialRequests?: string | null;
}) {
  const html = `
    <h2 style="font-family:Georgia,serif;color:#c1694f;">New Apartment Booking Request</h2>
    <table>
      ${row("Apartment", booking.apartmentName)}
      ${row("Guest", booking.guestName)}
      ${row("Email", booking.guestEmail)}
      ${row("Phone", booking.guestPhone || "—")}
      ${row("Arrival", booking.arrival)}
      ${row("Departure", booking.departure)}
      ${row("Nights", String(booking.nights))}
      ${row("Adults / Children", `${booking.adults} / ${booking.children}`)}
      ${row("Total", `$${booking.totalPriceUsd.toFixed(2)}`)}
    </table>
    ${booking.specialRequests ? `<p><strong>Special requests:</strong> ${escapeHtml(booking.specialRequests)}</p>` : ""}
    <p style="color:#6b6459;font-size:13px;">Confirm or manage this booking from the admin dashboard.</p>
  `;
  await sendNotification(`New booking request — ${booking.apartmentName}`, html);
}

export async function sendSafariBookingNotification(booking: {
  safariName: string;
  guestName: string;
  guestEmail: string;
  travelDate?: string | null;
  adults: number;
  children: number;
  notes?: string | null;
}) {
  const html = `
    <h2 style="font-family:Georgia,serif;color:#c1694f;">New Safari Booking Request</h2>
    <table>
      ${row("Safari", booking.safariName)}
      ${row("Guest", booking.guestName)}
      ${row("Email", booking.guestEmail)}
      ${row("Travel Date", booking.travelDate || "Flexible")}
      ${row("Adults / Children", `${booking.adults} / ${booking.children}`)}
    </table>
    ${booking.notes ? `<p><strong>Notes:</strong> ${escapeHtml(booking.notes)}</p>` : ""}
  `;
  await sendNotification(`New safari enquiry — ${booking.safariName}`, html);
}

export async function sendContactNotification(message: {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
}) {
  const html = `
    <h2 style="font-family:Georgia,serif;color:#c1694f;">New Contact Message</h2>
    <table>
      ${row("Name", message.name)}
      ${row("Email", message.email)}
      ${row("Phone", message.phone || "—")}
      ${row("Subject", message.subject || "General")}
    </table>
    <p style="white-space:pre-wrap;">${escapeHtml(message.message)}</p>
  `;
  await sendNotification(`New contact message from ${message.name}`, html);
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, Mail, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import {
  DescriptionList,
  PageHeader,
  Panel,
  StatusPill,
  Tag,
} from "@/components/admin/ui";
import { BookingEditor, PaymentForm } from "@/components/admin/booking-editors";
import { SubmitButton } from "@/components/admin/form";
import { setBookingStatus, setPaymentStatus } from "@/app/actions/admin/bookings";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDate, formatDateTime, formatMoney, humanise } from "@/lib/format";
import { telLink, whatsappLink } from "@/lib/whatsapp";
import type { Booking, Guest } from "@/lib/types";

export const metadata = { title: "Booking" };

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const db = supabaseAdmin();

  const { data } = await db.from("bookings").select("*").eq("id", id).maybeSingle();
  const booking = data as Booking | null;
  if (!booking) notFound();

  const [{ data: guestRow }, { data: historyRows }] = await Promise.all([
    booking.guest_id
      ? db.from("guests").select("*").eq("id", booking.guest_id).maybeSingle()
      : Promise.resolve({ data: null }),
    booking.guest_id
      ? db
          .from("bookings")
          .select("id, booking_reference, check_in, check_out, apartment_name_snapshot, booking_status")
          .eq("guest_id", booking.guest_id)
          .neq("id", booking.id)
          .order("check_in", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  const guest = guestRow as Guest | null;
  const history = (historyRows as Booking[]) ?? [];

  const wa = whatsappLink(
    guest?.whatsapp ?? booking.guest_phone_snapshot,
    `Hello ${booking.guest_name_snapshot.split(" ")[0]}, about your booking ${booking.booking_reference} at Siriba Resort Watamu…`,
  );
  const tel = telLink(booking.guest_phone_snapshot);

  const holdExpired =
    booking.hold_expires_at && new Date(booking.hold_expires_at) < new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        title={booking.guest_name_snapshot}
        subtitle={`${booking.apartment_name_snapshot} · ${booking.booking_reference}`}
        back={{ href: "/admin/bookings", label: "Bookings" }}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={booking.payment_status} />
            <StatusPill status={booking.booking_status} />
          </div>
        }
      />

      {created && (
        <p className="rounded-xl bg-[#dff0e4] px-4 py-3.5 text-sm text-[#1f6b3a]">
          Booking created.
        </p>
      )}

      {booking.booking_status === "held" && booking.hold_expires_at && (
        <div
          className={`flex flex-wrap items-center gap-3 rounded-xl px-4 py-3.5 text-sm ${
            holdExpired
              ? "bg-[#fbe1dc] text-[#a3402c]"
              : "bg-terracotta-soft/60 text-terracotta-dark"
          }`}
        >
          <Clock size={16} strokeWidth={1.6} className="shrink-0" />
          <span className="font-medium">
            {holdExpired
              ? "This hold has expired"
              : `Hold expires ${formatDateTime(booking.hold_expires_at)}`}
          </span>
          <span className="opacity-80">
            {holdExpired
              ? "The dates will be released on the next automatic sweep."
              : "Confirm before then to keep the dates."}
          </span>
        </div>
      )}

      {/* Status actions --------------------------------------------------- */}
      <Panel title="What next?" description="Change the status of this booking.">
        <div className="flex flex-wrap gap-2">
          {booking.booking_status !== "confirmed" &&
            booking.booking_status !== "cancelled" && (
              <StatusAction
                id={booking.id}
                status="confirmed"
                label="Confirm booking"
                variant="primary"
              />
            )}
          {["pending", "held", "confirmed"].includes(booking.booking_status) && (
            <StatusAction
              id={booking.id}
              status="cancelled"
              label="Cancel"
              variant="danger"
              confirm="Cancel this booking? The guest will be emailed and the dates released."
            />
          )}
          {booking.booking_status === "confirmed" && (
            <>
              <StatusAction id={booking.id} status="completed" label="Mark completed" />
              <StatusAction
                id={booking.id}
                status="no_show"
                label="No-show"
                confirm="Mark this booking as a no-show?"
              />
            </>
          )}
          {booking.booking_status === "cancelled" && (
            <StatusAction
              id={booking.id}
              status="pending"
              label="Reinstate as pending"
              confirm="Put this booking back to pending? It will occupy the dates again."
            />
          )}
        </div>

        <form action={setPaymentStatus} className="mt-5 flex flex-wrap items-end gap-2 border-t border-line pt-5">
          <input type="hidden" name="id" value={booking.id} />
          <div>
            <label className="field-label">Payment status override</label>
            <select
              name="paymentStatus"
              defaultValue={booking.payment_status}
              className="select w-56"
            >
              <option value="unpaid">Unpaid</option>
              <option value="deposit_required">Deposit required</option>
              <option value="partially_paid">Partially paid</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <SubmitButton variant="outline">Set</SubmitButton>
          <p className="basis-full text-xs text-ink-muted">
            Payment status is normally worked out from what has been paid. Use this for a
            refund, which cannot be inferred.
          </p>
        </form>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Panel title="The stay">
            <DescriptionList
              items={[
                { label: "Reference", value: booking.booking_reference },
                { label: "Accommodation", value: booking.apartment_name_snapshot },
                { label: "Check-in", value: formatDate(booking.check_in) },
                { label: "Check-out", value: formatDate(booking.check_out) },
                {
                  label: "Nights",
                  value: `${booking.nights} ${booking.nights === 1 ? "night" : "nights"}`,
                },
                { label: "Guests", value: String(booking.guests_count) },
                { label: "Source", value: humanise(booking.source) },
                { label: "Booked", value: formatDateTime(booking.created_at) },
                ...(booking.confirmed_at
                  ? [{ label: "Confirmed", value: formatDateTime(booking.confirmed_at) }]
                  : []),
                ...(booking.cancelled_at
                  ? [{ label: "Cancelled", value: formatDateTime(booking.cancelled_at) }]
                  : []),
              ]}
            />
          </Panel>

          <Panel title="Money" description="Figures frozen at the time of booking.">
            <DescriptionList
              items={[
                {
                  label: "Rate",
                  value: `${formatMoney(booking.rate_snapshot, booking.currency)} / night`,
                },
                ...(booking.cleaning_fee_snapshot > 0
                  ? [
                      {
                        label: "Cleaning fee",
                        value: formatMoney(booking.cleaning_fee_snapshot, booking.currency),
                      },
                    ]
                  : []),
                {
                  label: "Total",
                  value: (
                    <span className="font-display text-base font-semibold">
                      {formatMoney(booking.total_snapshot, booking.currency)}
                    </span>
                  ),
                },
                {
                  label: "Deposit required",
                  value: formatMoney(booking.deposit_required, booking.currency),
                },
                {
                  label: "Paid",
                  value: formatMoney(booking.amount_paid, booking.currency),
                },
                {
                  label: "Balance",
                  value:
                    booking.balance > 0 ? (
                      <Tag tone="amber">
                        {formatMoney(booking.balance, booking.currency)}
                      </Tag>
                    ) : (
                      <Tag tone="green">Settled</Tag>
                    ),
                },
                { label: "Method", value: booking.payment_method ?? "—" },
                { label: "Reference", value: booking.payment_reference ?? "—" },
                {
                  label: "Payment date",
                  value: booking.payment_date ? formatDate(booking.payment_date) : "—",
                },
              ]}
            />
          </Panel>

          {(booking.special_requests || booking.notes) && (
            <Panel title="Notes">
              {booking.special_requests && (
                <div>
                  <p className="text-xs tracking-[0.06em] text-ink-muted uppercase">
                    Guest requests
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line">
                    {booking.special_requests}
                  </p>
                </div>
              )}
              {booking.notes && (
                <div className={booking.special_requests ? "mt-5" : ""}>
                  <p className="text-xs tracking-[0.06em] text-ink-muted uppercase">
                    Internal
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-ink-muted">
                    {booking.notes}
                  </p>
                </div>
              )}
            </Panel>
          )}

          <Panel title="Guest">
            <DescriptionList
              items={[
                { label: "Name", value: booking.guest_name_snapshot },
                { label: "Email", value: booking.guest_email_snapshot },
                { label: "Phone", value: booking.guest_phone_snapshot ?? "—" },
                ...(guest?.country ? [{ label: "Country", value: guest.country }] : []),
              ]}
            />

            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={`mailto:${booking.guest_email_snapshot}?subject=${encodeURIComponent(`Your booking ${booking.booking_reference}`)}`}
                className="btn btn-outline btn-sm"
              >
                <Mail size={14} strokeWidth={1.6} />
                Email
              </a>
              {tel && (
                <a href={tel} className="btn btn-outline btn-sm">
                  <Phone size={14} strokeWidth={1.6} />
                  Call
                </a>
              )}
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp btn-sm"
                >
                  <WhatsAppIcon size={14} />
                  WhatsApp
                </a>
              )}
              {guest && (
                <Link href={`/admin/guests/${guest.id}`} className="btn btn-outline btn-sm">
                  Guest profile
                </Link>
              )}
            </div>

            {history.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-xs tracking-[0.06em] text-ink-muted uppercase">
                  Previous stays
                </p>
                <ul className="mt-2.5 space-y-2">
                  {history.map((past) => (
                    <li key={past.id} className="flex items-center justify-between gap-3">
                      <Link
                        href={`/admin/bookings/${past.id}`}
                        className="truncate text-sm transition-colors hover:text-terracotta"
                      >
                        {formatDate(past.check_in, "MMM yyyy")} ·{" "}
                        {past.apartment_name_snapshot}
                      </Link>
                      <StatusPill status={past.booking_status} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <PaymentForm booking={booking} />
          <BookingEditor booking={booking} />
        </div>
      </div>
    </div>
  );
}

function StatusAction({
  id,
  status,
  label,
  variant = "outline",
  confirm,
}: {
  id: string;
  status: string;
  label: string;
  variant?: "primary" | "outline" | "danger";
  confirm?: string;
}) {
  return (
    <form action={setBookingStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton variant={variant} confirm={confirm}>
        {label}
      </SubmitButton>
    </form>
  );
}

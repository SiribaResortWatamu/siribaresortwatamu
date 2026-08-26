import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import {
  DescriptionList,
  EmptyState,
  PageHeader,
  Panel,
  StatusPill,
  Td,
  TableWrap,
  Th,
} from "@/components/admin/ui";
import { GuestEditor } from "@/components/admin/guest-editor";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { telLink, whatsappLink } from "@/lib/whatsapp";
import type { Booking, Guest, SafariEnquiry, TransferBooking } from "@/lib/types";

export const metadata = { title: "Guest" };

export default async function GuestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = supabaseAdmin();

  const { data: guestRow } = await db
    .from("guests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const guest = guestRow as Guest | null;
  if (!guest) notFound();

  const [{ data: bookingRows }, { data: enquiryRows }, { data: transferRows }] =
    await Promise.all([
      db
        .from("bookings")
        .select("*")
        .eq("guest_id", id)
        .order("check_in", { ascending: false }),
      db
        .from("safari_enquiries")
        .select("*")
        .eq("guest_id", id)
        .order("created_at", { ascending: false }),
      db
        .from("transfer_bookings")
        .select("*")
        .eq("guest_id", id)
        .order("transfer_date", { ascending: false }),
    ]);

  const bookings = (bookingRows as Booking[]) ?? [];
  const enquiries = (enquiryRows as SafariEnquiry[]) ?? [];
  const transfers = (transferRows as TransferBooking[]) ?? [];

  const stayed = bookings.filter((b) =>
    ["confirmed", "completed"].includes(b.booking_status),
  );
  const totalSpend = stayed.reduce((sum, b) => sum + Number(b.total_snapshot), 0);
  const outstanding = bookings.reduce(
    (sum, b) => sum + (b.balance > 0 && b.booking_status !== "cancelled" ? b.balance : 0),
    0,
  );

  const wa = whatsappLink(
    guest.whatsapp ?? guest.phone,
    `Hello ${guest.name.split(" ")[0]}, this is Siriba Resort Watamu.`,
  );
  const tel = telLink(guest.phone);

  return (
    <div className="space-y-6">
      <PageHeader
        title={guest.name}
        subtitle={guest.email}
        back={{ href: "/admin/guests", label: "Guests" }}
        actions={
          <div className="flex gap-2">
            <a
              href={`mailto:${guest.email}`}
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
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Panel title="Summary">
            <DescriptionList
              items={[
                { label: "Stays", value: String(stayed.length) },
                {
                  label: "Total spend",
                  value: formatMoney(totalSpend, bookings[0]?.currency ?? "KES"),
                },
                {
                  label: "Outstanding",
                  value:
                    outstanding > 0
                      ? formatMoney(outstanding, bookings[0]?.currency ?? "KES")
                      : "Nothing owed",
                },
                { label: "Safari enquiries", value: String(enquiries.length) },
                { label: "Transfers", value: String(transfers.length) },
                { label: "First seen", value: formatDateTime(guest.created_at) },
              ]}
            />
          </Panel>

          <Panel title="Bookings" bodyClassName="">
            {bookings.length === 0 ? (
              <EmptyState title="No bookings yet" />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Reference</Th>
                    <Th>Accommodation</Th>
                    <Th>Dates</Th>
                    <Th align="right">Total</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <Td>
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="font-medium tabular-nums transition-colors hover:text-terracotta"
                        >
                          {booking.booking_reference}
                        </Link>
                      </Td>
                      <Td className="text-sm">{booking.apartment_name_snapshot}</Td>
                      <Td className="text-sm whitespace-nowrap">
                        {formatDate(booking.check_in, "d MMM")}
                        <span className="mx-1 text-ink-muted">→</span>
                        {formatDate(booking.check_out, "d MMM yyyy")}
                      </Td>
                      <Td align="right" className="text-sm whitespace-nowrap">
                        {formatMoney(booking.total_snapshot, booking.currency, {
                          decimals: false,
                        })}
                      </Td>
                      <Td>
                        <StatusPill status={booking.booking_status} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Panel>

          {enquiries.length > 0 && (
            <Panel title="Safari enquiries" bodyClassName="">
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Safari</Th>
                    <Th>Travel date</Th>
                    <Th>Travellers</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((enquiry) => (
                    <tr key={enquiry.id}>
                      <Td>
                        <Link
                          href={`/admin/safaris/enquiries/${enquiry.id}`}
                          className="text-sm font-medium transition-colors hover:text-terracotta"
                        >
                          {enquiry.safari_name_snapshot}
                        </Link>
                      </Td>
                      <Td className="text-sm">
                        {enquiry.travel_date ? formatDate(enquiry.travel_date) : "Flexible"}
                      </Td>
                      <Td className="text-sm">{enquiry.travellers}</Td>
                      <Td>
                        <StatusPill status={enquiry.status} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Panel>
          )}

          {transfers.length > 0 && (
            <Panel title="Transfers" bodyClassName="">
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Service</Th>
                    <Th>Route</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer) => (
                    <tr key={transfer.id}>
                      <Td className="text-sm whitespace-nowrap">
                        {formatDate(transfer.transfer_date)}
                      </Td>
                      <Td>
                        <Link
                          href={`/admin/transfers/requests/${transfer.id}`}
                          className="text-sm font-medium transition-colors hover:text-terracotta"
                        >
                          {transfer.transfer_name_snapshot}
                        </Link>
                      </Td>
                      <Td className="text-xs text-ink-muted">
                        {transfer.pickup_location} → {transfer.dropoff_location}
                      </Td>
                      <Td>
                        <StatusPill status={transfer.booking_status} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Panel>
          )}
        </div>

        <GuestEditor guest={guest} />
      </div>
    </div>
  );
}

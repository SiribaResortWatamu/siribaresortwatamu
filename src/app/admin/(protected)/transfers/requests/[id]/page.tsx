import { notFound } from "next/navigation";
import { Mail, MessageCircle, Phone } from "lucide-react";
import {
  DescriptionList,
  PageHeader,
  Panel,
  StatusPill,
} from "@/components/admin/ui";
import { TransferRequestEditor } from "@/components/admin/transfer-request-editor";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDate, formatDateTime, formatMoney, formatTime } from "@/lib/format";
import { telLink, whatsappLink } from "@/lib/whatsapp";
import type { Driver, TransferBooking, Vehicle } from "@/lib/types";

export const metadata = { title: "Transfer Request" };

export default async function TransferRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = supabaseAdmin();

  const [{ data: requestRow }, { data: driverRows }, { data: vehicleRows }] =
    await Promise.all([
      db.from("transfer_bookings").select("*").eq("id", id).maybeSingle(),
      db.from("drivers").select("*").order("name"),
      db.from("vehicles").select("*").order("name"),
    ]);

  const request = requestRow as TransferBooking | null;
  if (!request) notFound();

  const drivers = (driverRows as Driver[]) ?? [];
  const vehicles = (vehicleRows as Vehicle[]) ?? [];
  const driver = drivers.find((d) => d.id === request.driver_id);

  const wa = whatsappLink(
    request.whatsapp ?? request.phone,
    `Hello ${request.passenger_name.split(" ")[0]}, about your transfer on ${formatDate(request.transfer_date)}…`,
  );
  const tel = telLink(request.phone);
  const driverWa = whatsappLink(
    driver?.whatsapp ?? driver?.phone,
    `Transfer ${request.reference} on ${formatDate(request.transfer_date)}: pick up ${request.passenger_name} at ${request.pickup_location}${
      request.pickup_time ? ` at ${formatTime(request.pickup_time)}` : ""
    }, drop at ${request.dropoff_location}.`,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={request.passenger_name}
        subtitle={`${request.transfer_name_snapshot} · ${request.reference}`}
        back={{ href: "/admin/transfers/requests", label: "Transfer requests" }}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill status={request.payment_status} />
            <StatusPill status={request.booking_status} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Panel title="The journey">
            <DescriptionList
              items={[
                { label: "Reference", value: request.reference },
                { label: "Service", value: request.transfer_name_snapshot },
                { label: "Date", value: formatDate(request.transfer_date) },
                {
                  label: "Pick-up time",
                  value: request.pickup_time
                    ? formatTime(request.pickup_time)
                    : "To be confirmed",
                },
                { label: "Pick-up", value: request.pickup_location },
                { label: "Drop-off", value: request.dropoff_location },
                { label: "Passengers", value: String(request.passengers) },
                { label: "Luggage", value: `${request.luggage} items` },
                ...(request.flight_number
                  ? [{ label: "Flight", value: request.flight_number }]
                  : []),
                ...(request.train_number
                  ? [{ label: "Train", value: request.train_number }]
                  : []),
                { label: "Requested", value: formatDateTime(request.created_at) },
              ]}
            />
          </Panel>

          {request.special_instructions && (
            <Panel title="Special instructions">
              <p className="text-sm leading-relaxed whitespace-pre-line text-ink-muted">
                {request.special_instructions}
              </p>
            </Panel>
          )}

          <Panel title="Money">
            <DescriptionList
              items={[
                {
                  label: "Fare",
                  value: formatMoney(request.price_snapshot, request.currency),
                },
                {
                  label: "Paid",
                  value: formatMoney(request.amount_paid, request.currency),
                },
                {
                  label: "Balance",
                  value:
                    request.balance > 0
                      ? formatMoney(request.balance, request.currency)
                      : "Settled",
                },
                { label: "Method", value: request.payment_method ?? "—" },
                { label: "Reference", value: request.payment_reference ?? "—" },
              ]}
            />
          </Panel>

          <Panel title="Contact">
            <DescriptionList
              items={[
                { label: "Email", value: request.email },
                { label: "Phone", value: request.phone ?? "—" },
                { label: "WhatsApp", value: request.whatsapp ?? "—" },
              ]}
            />

            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={`mailto:${request.email}?subject=${encodeURIComponent(`Your transfer — ${request.reference}`)}`}
                className="btn btn-outline btn-sm"
              >
                <Mail size={14} strokeWidth={1.6} />
                Email customer
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
                  <MessageCircle size={14} strokeWidth={1.75} />
                  WhatsApp customer
                </a>
              )}
            </div>

            {driver && driverWa && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="mb-2.5 text-xs text-ink-muted">
                  Send the job to {driver.name}:
                </p>
                <a
                  href={driverWa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp btn-sm"
                >
                  <MessageCircle size={14} strokeWidth={1.75} />
                  WhatsApp driver
                </a>
              </div>
            )}
          </Panel>
        </div>

        <TransferRequestEditor
          request={request}
          drivers={drivers}
          vehicles={vehicles}
        />
      </div>
    </div>
  );
}

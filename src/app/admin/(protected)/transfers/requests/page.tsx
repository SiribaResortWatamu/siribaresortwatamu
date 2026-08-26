import Link from "next/link";
import { Car } from "lucide-react";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusPill,
  Td,
  TableWrap,
  Th,
} from "@/components/admin/ui";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Driver, TransferBooking, TransferStatus } from "@/lib/types";

export const metadata = { title: "Transfer Requests" };

const FILTERS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "driver_assigned", label: "Driver assigned" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

const OPEN: TransferStatus[] = [
  "pending",
  "confirmed",
  "driver_assigned",
  "in_progress",
];

export default async function TransferRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "upcoming" } = await searchParams;
  const db = supabaseAdmin();

  let query = db.from("transfer_bookings").select("*");

  if (status === "upcoming") {
    query = query
      .in("booking_status", OPEN)
      .order("transfer_date", { ascending: true })
      .order("pickup_time", { ascending: true, nullsFirst: false });
  } else {
    if (status !== "all") query = query.eq("booking_status", status);
    query = query.order("transfer_date", { ascending: false });
  }

  const [{ data: requestRows }, { data: driverRows }] = await Promise.all([
    query,
    db.from("drivers").select("*"),
  ]);

  const requests = (requestRows as TransferBooking[]) ?? [];
  const drivers = new Map(
    ((driverRows as Driver[]) ?? []).map((driver) => [driver.id, driver]),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transfer requests"
        subtitle="Assign a driver and vehicle, then confirm the job."
        back={{ href: "/admin/transfers", label: "Transfers" }}
      />

      <nav className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/transfers/requests?status=${filter.value}`}
            className={cn(
              "pill border transition-colors",
              status === filter.value
                ? "border-ocean bg-ocean text-white"
                : "border-line bg-white text-ink-muted hover:border-ink hover:text-ink",
            )}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <Panel bodyClassName="">
        {requests.length === 0 ? (
          <EmptyState
            icon={<Car size={20} strokeWidth={1.4} />}
            title="No transfer requests here"
            description="Requests sent from a transfer page land in this list."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Customer</Th>
                <Th>Route</Th>
                <Th>Driver</Th>
                <Th align="right">Fare</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => {
                const driver = request.driver_id
                  ? drivers.get(request.driver_id)
                  : undefined;

                return (
                  <tr key={request.id}>
                    <Td className="whitespace-nowrap">
                      <span className="font-medium">
                        {formatDate(request.transfer_date, "d MMM yyyy")}
                      </span>
                      <span className="block text-xs text-ink-muted">
                        {request.pickup_time ? formatTime(request.pickup_time) : "Time TBC"}
                      </span>
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/transfers/requests/${request.id}`}
                        className="font-medium transition-colors hover:text-terracotta"
                      >
                        {request.passenger_name}
                      </Link>
                      <span className="block text-xs text-ink-muted tabular-nums">
                        {request.reference} · {request.passengers} pax
                      </span>
                    </Td>
                    <Td className="text-xs text-ink-muted">
                      {request.pickup_location}
                      <span className="mx-1">→</span>
                      {request.dropoff_location}
                      <span className="mt-0.5 block">
                        {request.transfer_name_snapshot}
                      </span>
                    </Td>
                    <Td className="text-sm">
                      {driver ? (
                        driver.name
                      ) : (
                        <span className="text-terracotta">Unassigned</span>
                      )}
                    </Td>
                    <Td align="right" className="text-sm whitespace-nowrap">
                      {request.price_snapshot > 0
                        ? formatMoney(request.price_snapshot, request.currency, {
                            decimals: false,
                          })
                        : "To quote"}
                    </Td>
                    <Td>
                      <StatusPill status={request.payment_status} />
                    </Td>
                    <Td>
                      <StatusPill status={request.booking_status} />
                    </Td>
                    <Td align="right">
                      <Link
                        href={`/admin/transfers/requests/${request.id}`}
                        className="btn btn-outline btn-sm"
                      >
                        Open
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
}

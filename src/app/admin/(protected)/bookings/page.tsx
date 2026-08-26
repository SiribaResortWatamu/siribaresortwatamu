import Link from "next/link";
import { format } from "date-fns";
import { BedDouble, Plus, Search } from "lucide-react";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusPill,
  Tag,
  Td,
  TableWrap,
  Th,
} from "@/components/admin/ui";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDate, formatMoney, humanise } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Booking } from "@/lib/types";

export const metadata = { title: "Bookings" };

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const VIEW_FILTERS = [
  { value: "", label: "Everything" },
  { value: "upcoming", label: "Upcoming" },
  { value: "arrivals", label: "Arriving today" },
  { value: "departures", label: "Leaving today" },
  { value: "owing", label: "Owing money" },
];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; filter?: string; q?: string }>;
}) {
  const { status = "", filter = "", q = "" } = await searchParams;
  const today = format(new Date(), "yyyy-MM-dd");

  let query = supabaseAdmin().from("bookings").select("*");

  if (status === "pending") {
    query = query.in("booking_status", ["pending", "held"]);
  } else if (status) {
    query = query.eq("booking_status", status);
  }

  if (filter === "arrivals") query = query.eq("check_in", today);
  if (filter === "departures") query = query.eq("check_out", today);
  if (filter === "upcoming") query = query.gte("check_in", today);
  if (filter === "owing") {
    query = query.gt("balance", 0).in("booking_status", ["confirmed", "completed"]);
  }

  if (q.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(
      `guest_name_snapshot.ilike.${term},booking_reference.ilike.${term},guest_email_snapshot.ilike.${term}`,
    );
  }

  const { data } = await query
    .order("check_in", { ascending: filter === "upcoming" })
    .limit(200);

  const bookings = (data as Booking[]) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        subtitle="Every stay, from every source, in one list."
        actions={
          <Link href="/admin/bookings/new" className="btn btn-primary btn-sm">
            <Plus size={15} strokeWidth={2} />
            New Booking
          </Link>
        }
      />

      {/* Filters -------------------------------------------------------- */}
      <div className="space-y-3">
        <FilterRow
          label="Status"
          options={STATUS_FILTERS}
          current={status}
          build={(value) => buildHref({ status: value, filter, q })}
        />
        <FilterRow
          label="View"
          options={VIEW_FILTERS}
          current={filter}
          build={(value) => buildHref({ status, filter: value, q })}
        />

        <form className="flex max-w-md gap-2" action="/admin/bookings">
          {status && <input type="hidden" name="status" value={status} />}
          {filter && <input type="hidden" name="filter" value={filter} />}
          <input
            name="q"
            defaultValue={q}
            className="input"
            placeholder="Search name, email or reference…"
            aria-label="Search bookings"
          />
          <button type="submit" className="btn btn-outline btn-sm shrink-0">
            <Search size={14} strokeWidth={1.75} />
            Search
          </button>
        </form>
      </div>

      <Panel bodyClassName="">
        {bookings.length === 0 ? (
          <EmptyState
            icon={<BedDouble size={20} strokeWidth={1.4} />}
            title="No bookings match"
            description={
              q
                ? `Nothing found for “${q}”.`
                : "Bookings from the website, and any you add yourself, appear here."
            }
            action={
              <Link href="/admin/bookings" className="btn btn-outline btn-sm">
                Clear filters
              </Link>
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Reference</Th>
                <Th>Guest</Th>
                <Th>Accommodation</Th>
                <Th>Dates</Th>
                <Th align="right">Total</Th>
                <Th align="right">Balance</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <Td className="whitespace-nowrap">
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="font-medium tabular-nums transition-colors hover:text-terracotta"
                    >
                      {booking.booking_reference}
                    </Link>
                    <span className="block text-xs text-ink-muted">
                      {humanise(booking.source)}
                    </span>
                  </Td>
                  <Td>
                    <span className="block font-medium">
                      {booking.guest_name_snapshot}
                    </span>
                    <span className="block truncate text-xs text-ink-muted">
                      {booking.guest_email_snapshot}
                    </span>
                  </Td>
                  <Td className="text-sm">{booking.apartment_name_snapshot}</Td>
                  <Td className="text-sm whitespace-nowrap">
                    {formatDate(booking.check_in, "d MMM")}
                    <span className="mx-1 text-ink-muted">→</span>
                    {formatDate(booking.check_out, "d MMM yyyy")}
                    <span className="block text-xs text-ink-muted">
                      {booking.nights} {booking.nights === 1 ? "night" : "nights"} ·{" "}
                      {booking.guests_count} pax
                    </span>
                  </Td>
                  <Td align="right" className="text-sm whitespace-nowrap">
                    {formatMoney(booking.total_snapshot, booking.currency, {
                      decimals: false,
                    })}
                  </Td>
                  <Td align="right" className="whitespace-nowrap">
                    {booking.balance > 0 ? (
                      <Tag tone="amber">
                        {formatMoney(booking.balance, booking.currency, {
                          decimals: false,
                        })}
                      </Tag>
                    ) : (
                      <span className="text-xs text-ink-muted">—</span>
                    )}
                  </Td>
                  <Td>
                    <StatusPill status={booking.payment_status} />
                  </Td>
                  <Td>
                    <StatusPill status={booking.booking_status} />
                  </Td>
                  <Td align="right">
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      Open
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      {bookings.length === 200 && (
        <p className="text-xs text-ink-muted">
          Showing the first 200 matches. Narrow the filters or search to see more.
        </p>
      )}
    </div>
  );
}

function FilterRow({
  label,
  options,
  current,
  build,
}: {
  label: string;
  options: { value: string; label: string }[];
  current: string;
  build: (value: string) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-14 shrink-0 text-[0.7rem] tracking-[0.08em] text-ink-muted uppercase">
        {label}
      </span>
      {options.map((option) => (
        <Link
          key={option.value || "all"}
          href={build(option.value)}
          className={cn(
            "pill border transition-colors",
            current === option.value
              ? "border-ocean bg-ocean text-white"
              : "border-line bg-white text-ink-muted hover:border-ink hover:text-ink",
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}

function buildHref(params: Record<string, string>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `/admin/bookings?${query}` : "/admin/bookings";
}

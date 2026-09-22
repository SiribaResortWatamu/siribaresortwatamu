import Link from "next/link";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
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
import type { Booking, BlockedDate } from "@/lib/types";

export const metadata = { title: "Bookings" };

/**
 * A reservation held on Airbnb or Booking.com.
 *
 * These arrive through the iCal sync and live in `blocked_dates`, not in
 * `bookings` — the feeds carry dates and nothing else, so there is no
 * guest, no price and no reference to store. They are listed here anyway
 * because an owner looking at this page wants to see every occupied night,
 * whichever channel sold it.
 */
interface ChannelStay {
  id: string;
  source: string;
  apartmentName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
}

type Row =
  | { kind: "direct"; sortKey: string; booking: Booking }
  | { kind: "channel"; sortKey: string; stay: ChannelStay };

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
  { value: "channels", label: "Airbnb & Booking.com" },
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

  // Soonest-first reads better when the list is forward-looking.
  const ascending = filter === "upcoming" || filter === "channels";

  const bookings =
    filter === "channels"
      ? []
      : (((await query.order("check_in", { ascending }).limit(200)).data ??
          []) as Booking[]);

  const channelStays = await getChannelStays({ status, filter, q, today });

  const rows: Row[] = [
    ...bookings.map((booking) => ({
      kind: "direct" as const,
      sortKey: booking.check_in,
      booking,
    })),
    ...channelStays.map((stay) => ({
      kind: "channel" as const,
      sortKey: stay.checkIn,
      stay,
    })),
  ].sort((a, b) =>
    ascending
      ? a.sortKey.localeCompare(b.sortKey)
      : b.sortKey.localeCompare(a.sortKey),
  );

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
        {rows.length === 0 ? (
          <EmptyState
            icon={<BedDouble size={20} strokeWidth={1.4} />}
            title="No bookings match"
            description={
              q
                ? `Nothing found for “${q}”.`
                : "Bookings from the website, from Airbnb and Booking.com, and any you add yourself, appear here."
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
              {rows.map((row) => {
                if (row.kind === "channel") {
                  return <ChannelRow key={row.stay.id} stay={row.stay} />;
                }

                const booking = row.booking;

                return (
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
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      {(bookings.length === 200 || channelStays.length === 200) && (
        <p className="text-xs text-ink-muted">
          Showing the first 200 matches. Narrow the filters or search to see more.
        </p>
      )}
    </div>
  );
}

/**
 * Reservations held on a channel, filtered to match the list they join.
 *
 * They are left out whenever a filter asks something a feed cannot answer —
 * a booking status, or an outstanding balance — rather than padding the
 * table with rows of dashes.
 */
async function getChannelStays({
  status,
  filter,
  q,
  today,
}: {
  status: string;
  filter: string;
  q: string;
  today: string;
}): Promise<ChannelStay[]> {
  if (status || filter === "owing") return [];

  let query = supabaseAdmin()
    .from("blocked_dates")
    .select("id, apartment_id, start_date, end_date, source")
    .in("source", ["airbnb", "booking_com"]);

  if (filter === "arrivals") query = query.eq("start_date", today);
  if (filter === "departures") query = query.eq("end_date", today);
  if (filter === "upcoming") query = query.gte("start_date", today);

  const { data } = await query.limit(200);
  const blocks = (data ?? []) as BlockedDate[];
  if (blocks.length === 0) return [];

  const { data: apartmentRows } = await supabaseAdmin()
    .from("apartments")
    .select("id, name");

  const names = new Map(
    (apartmentRows ?? []).map((row) => [row.id as string, row.name as string]),
  );

  const term = q.trim().toLowerCase();

  return blocks
    .map((block) => ({
      id: block.id,
      source: block.source,
      apartmentName: names.get(block.apartment_id ?? "") ?? "Unknown apartment",
      checkIn: block.start_date,
      checkOut: block.end_date,
      nights: differenceInCalendarDays(
        parseISO(block.end_date),
        parseISO(block.start_date),
      ),
    }))
    // The search box covers guest, email and reference. A feed supplies
    // none of those, so match on the one field it does give us.
    .filter((stay) => !term || stay.apartmentName.toLowerCase().includes(term));
}

/**
 * One channel reservation.
 *
 * Money and guest columns are left blank on purpose: Airbnb and
 * Booking.com keep both, and inventing a placeholder would make the
 * totals on this page look like they mean something.
 */
function ChannelRow({ stay }: { stay: ChannelStay }) {
  return (
    <tr className="bg-sand/40">
      <Td className="whitespace-nowrap">
        <span className="font-medium">{humanise(stay.source)}</span>
        <span className="block text-xs text-ink-muted">Synced reservation</span>
      </Td>
      <Td>
        <span className="text-sm text-ink-muted">Not shared by the channel</span>
      </Td>
      <Td className="text-sm">{stay.apartmentName}</Td>
      <Td className="text-sm whitespace-nowrap">
        {formatDate(stay.checkIn, "d MMM")}
        <span className="mx-1 text-ink-muted">→</span>
        {formatDate(stay.checkOut, "d MMM yyyy")}
        <span className="block text-xs text-ink-muted">
          {stay.nights} {stay.nights === 1 ? "night" : "nights"}
        </span>
      </Td>
      <Td align="right" className="text-xs text-ink-muted">
        —
      </Td>
      <Td align="right" className="text-xs text-ink-muted">
        —
      </Td>
      <Td>
        <span className="text-xs text-ink-muted">Held by channel</span>
      </Td>
      <Td>
        <Tag tone="ocean">Reserved</Tag>
      </Td>
      <Td align="right">
        <Link href="/admin/calendar" className="btn btn-outline btn-sm">
          Calendar
        </Link>
      </Td>
    </tr>
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

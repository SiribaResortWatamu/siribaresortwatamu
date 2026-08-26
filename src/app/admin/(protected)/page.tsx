import Link from "next/link";
import { format } from "date-fns";
import {
  BedDouble,
  CalendarCheck,
  CalendarX,
  Car,
  Compass,
  LogIn,
  LogOut,
  Mail,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatCard,
  StatusPill,
  Tag,
  Td,
  TableWrap,
  Th,
} from "@/components/admin/ui";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/data/settings";
import { formatDate, formatMoney, timeAgo } from "@/lib/format";
import type {
  ActivityEntry,
  Apartment,
  Booking,
  DashboardStats,
  TransferBooking,
} from "@/lib/types";

export default async function AdminDashboardPage() {
  const db = supabaseAdmin();
  const today = format(new Date(), "yyyy-MM-dd");

  const [
    { data: statsData },
    settings,
    { data: arrivalsData },
    { data: departuresData },
    { data: inHouseData },
    { data: housekeepingData },
    { data: transfersData },
    { data: activityData },
  ] = await Promise.all([
    db.rpc("dashboard_stats"),
    getSettings(),
    db
      .from("bookings")
      .select("*")
      .eq("check_in", today)
      .in("booking_status", ["confirmed", "pending", "held"])
      .order("guest_name_snapshot"),
    db
      .from("bookings")
      .select("*")
      .eq("check_out", today)
      .in("booking_status", ["confirmed", "completed"])
      .order("guest_name_snapshot"),
    db
      .from("bookings")
      .select("*")
      .eq("booking_status", "confirmed")
      .lte("check_in", today)
      .gt("check_out", today)
      .order("check_out"),
    db
      .from("apartments")
      .select("id, name, slug, housekeeping, status")
      .neq("status", "archived")
      .order("display_order"),
    db
      .from("transfer_bookings")
      .select("*")
      .gte("transfer_date", today)
      .not("booking_status", "in", "(completed,cancelled)")
      .order("transfer_date")
      .limit(6),
    db.from("activity_log").select("*").order("created_at", { ascending: false }).limit(12),
  ]);

  const stats = (statsData as DashboardStats | null) ?? EMPTY_STATS;
  const currency = settings?.default_currency ?? "KES";
  const arrivals = (arrivalsData as Booking[]) ?? [];
  const departures = (departuresData as Booking[]) ?? [];
  const inHouse = (inHouseData as Booking[]) ?? [];
  const housekeeping = (housekeepingData as Apartment[]) ?? [];
  const transfers = (transfersData as TransferBooking[]) ?? [];
  const activity = (activityData as ActivityEntry[]) ?? [];

  const needsAttention = housekeeping.filter((a) =>
    ["cleaning", "maintenance"].includes(a.housekeeping),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle={format(new Date(), "EEEE d MMMM yyyy")}
        actions={
          <>
            <Link href="/admin/bookings/new" className="btn btn-primary btn-sm">
              New Booking
            </Link>
            <Link href="/admin/calendar" className="btn btn-outline btn-sm">
              Calendar
            </Link>
          </>
        }
      />

      {/* Today ---------------------------------------------------------- */}
      <section>
        <h2 className="mb-3 text-xs font-medium tracking-[0.12em] text-ink-muted uppercase">
          Today
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Arrivals"
            value={stats.arrivals_today}
            hint={stats.arrivals_today ? "Check-ins expected" : "Nobody arriving"}
            icon={<LogIn size={17} strokeWidth={1.5} />}
            href="/admin/bookings?filter=arrivals"
            tone={stats.arrivals_today > 0 ? "attention" : "neutral"}
          />
          <StatCard
            label="Departures"
            value={stats.departures_today}
            hint={stats.departures_today ? "Check-outs due" : "Nobody leaving"}
            icon={<LogOut size={17} strokeWidth={1.5} />}
            href="/admin/bookings?filter=departures"
          />
          <StatCard
            label="Guests in house"
            value={stats.current_guests}
            hint={`${inHouse.length} ${inHouse.length === 1 ? "booking" : "bookings"} staying`}
            icon={<Users size={17} strokeWidth={1.5} />}
          />
          <StatCard
            label="Rooms to clean"
            value={stats.rooms_needing_clean}
            hint={needsAttention.length ? "Needs attention" : "All ready"}
            icon={<Sparkles size={17} strokeWidth={1.5} />}
            tone={stats.rooms_needing_clean > 0 ? "attention" : "neutral"}
          />
        </div>
      </section>

      {/* Outstanding ---------------------------------------------------- */}
      <section>
        <h2 className="mb-3 text-xs font-medium tracking-[0.12em] text-ink-muted uppercase">
          Needs a decision
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Pending bookings"
            value={stats.pending_bookings}
            icon={<CalendarCheck size={17} strokeWidth={1.5} />}
            href="/admin/bookings?status=pending"
            tone={stats.pending_bookings > 0 ? "attention" : "neutral"}
          />
          <StatCard
            label="Confirmed"
            value={stats.confirmed_bookings}
            icon={<BedDouble size={17} strokeWidth={1.5} />}
            href="/admin/bookings?status=confirmed"
          />
          <StatCard
            label="Owed to us"
            value={formatMoney(stats.outstanding_balance, currency, { decimals: false })}
            hint="Unpaid balances"
            icon={<Wallet size={17} strokeWidth={1.5} />}
            href="/admin/bookings?filter=owing"
            tone={stats.outstanding_balance > 0 ? "attention" : "neutral"}
          />
          <StatCard
            label="Safari enquiries"
            value={stats.safari_enquiries}
            icon={<Compass size={17} strokeWidth={1.5} />}
            href="/admin/safaris/enquiries"
            tone={stats.safari_enquiries > 0 ? "attention" : "neutral"}
          />
          <StatCard
            label="Transfer requests"
            value={stats.transfer_requests}
            icon={<Car size={17} strokeWidth={1.5} />}
            href="/admin/transfers/requests"
            tone={stats.transfer_requests > 0 ? "attention" : "neutral"}
          />
        </div>

        {stats.unread_messages > 0 && (
          <Link
            href="/admin/messages"
            className="mt-4 flex items-center gap-3 rounded-xl border border-terracotta/40 bg-terracotta-soft/40 px-5 py-4 text-sm transition-colors hover:bg-terracotta-soft/60"
          >
            <Mail size={17} strokeWidth={1.5} className="text-terracotta" />
            <span className="font-medium">
              {stats.unread_messages} unread{" "}
              {stats.unread_messages === 1 ? "message" : "messages"}
            </span>
            <span className="text-ink-muted">— someone is waiting for a reply</span>
          </Link>
        )}
      </section>

      {/* Arrivals / departures ------------------------------------------ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Arriving today"
          bodyClassName=""
          actions={
            <Link href="/admin/bookings" className="text-xs font-medium text-ocean">
              All bookings
            </Link>
          }
        >
          {arrivals.length === 0 ? (
            <EmptyState
              title="No arrivals today"
              description="Nobody is due to check in."
              icon={<LogIn size={20} strokeWidth={1.4} />}
            />
          ) : (
            <MovementTable bookings={arrivals} kind="arrival" currency={currency} />
          )}
        </Panel>

        <Panel
          title="Departing today"
          bodyClassName=""
          actions={
            <Link href="/admin/calendar" className="text-xs font-medium text-ocean">
              Calendar
            </Link>
          }
        >
          {departures.length === 0 ? (
            <EmptyState
              title="No departures today"
              description="Nobody is checking out."
              icon={<CalendarX size={20} strokeWidth={1.4} />}
            />
          ) : (
            <MovementTable bookings={departures} kind="departure" currency={currency} />
          )}
        </Panel>
      </div>

      {/* Rooms + transfers ---------------------------------------------- */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Panel
          title="Room status"
          description="Housekeeping across the property"
          bodyClassName="p-5"
        >
          {housekeeping.length === 0 ? (
            <EmptyState title="No accommodation yet" />
          ) : (
            <ul className="space-y-2.5">
              {housekeeping.map((apartment) => (
                <li
                  key={apartment.id}
                  className="flex items-center justify-between gap-3"
                >
                  <Link
                    href={`/admin/accommodation/${apartment.id}`}
                    className="truncate text-sm transition-colors hover:text-terracotta"
                  >
                    {apartment.name}
                  </Link>
                  <StatusPill status={apartment.housekeeping} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Upcoming transfers"
          bodyClassName=""
          actions={
            <Link
              href="/admin/transfers/requests"
              className="text-xs font-medium text-ocean"
            >
              All requests
            </Link>
          }
        >
          {transfers.length === 0 ? (
            <EmptyState
              title="Nothing scheduled"
              description="No transfers are booked for the days ahead."
              icon={<Car size={20} strokeWidth={1.4} />}
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Passenger</Th>
                  <Th>Route</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer) => (
                  <tr key={transfer.id}>
                    <Td className="whitespace-nowrap">
                      <span className="font-medium">
                        {formatDate(transfer.transfer_date, "d MMM")}
                      </span>
                      {transfer.pickup_time && (
                        <span className="block text-xs text-ink-muted">
                          {transfer.pickup_time.slice(0, 5)}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/transfers/requests/${transfer.id}`}
                        className="font-medium transition-colors hover:text-terracotta"
                      >
                        {transfer.passenger_name}
                      </Link>
                      <span className="block text-xs text-ink-muted">
                        {transfer.passengers} pax
                      </span>
                    </Td>
                    <Td className="text-xs text-ink-muted">
                      {transfer.pickup_location}
                      <span className="mx-1">→</span>
                      {transfer.dropoff_location}
                    </Td>
                    <Td>
                      <StatusPill status={transfer.booking_status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      </div>

      {/* In house + activity -------------------------------------------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Currently staying" bodyClassName="p-5">
          {inHouse.length === 0 ? (
            <EmptyState
              title="The property is empty"
              description="No confirmed bookings cover tonight."
              icon={<BedDouble size={20} strokeWidth={1.4} />}
            />
          ) : (
            <ul className="divide-y divide-line/70">
              {inHouse.map((booking) => (
                <li key={booking.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="text-sm font-medium transition-colors hover:text-terracotta"
                      >
                        {booking.guest_name_snapshot}
                      </Link>
                      <p className="truncate text-xs text-ink-muted">
                        {booking.apartment_name_snapshot} ·{" "}
                        {booking.guests_count}{" "}
                        {booking.guests_count === 1 ? "guest" : "guests"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-ink-muted">Out</p>
                      <p className="text-sm font-medium">
                        {formatDate(booking.check_out, "d MMM")}
                      </p>
                    </div>
                  </div>
                  {booking.balance > 0 && (
                    <Tag tone="amber" className="mt-2">
                      {formatMoney(booking.balance, booking.currency)} outstanding
                    </Tag>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent activity" bodyClassName="p-5">
          {activity.length === 0 ? (
            <EmptyState
              title="Nothing yet"
              description="Bookings, enquiries and payments will appear here."
            />
          ) : (
            <ol className="space-y-3.5">
              {activity.map((entry) => (
                <li key={entry.id} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" />
                  <div className="min-w-0">
                    <p className="text-sm leading-snug">{entry.title}</p>
                    {entry.detail && (
                      <p className="truncate text-xs text-ink-muted">{entry.detail}</p>
                    )}
                    <p className="mt-0.5 text-[0.7rem] text-ink-muted">
                      {timeAgo(entry.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}

function MovementTable({
  bookings,
  kind,
  currency,
}: {
  bookings: Booking[];
  kind: "arrival" | "departure";
  currency: string;
}) {
  return (
    <TableWrap>
      <thead>
        <tr>
          <Th>Guest</Th>
          <Th>Accommodation</Th>
          <Th>{kind === "arrival" ? "Nights" : "Balance"}</Th>
          <Th>Status</Th>
        </tr>
      </thead>
      <tbody>
        {bookings.map((booking) => (
          <tr key={booking.id}>
            <Td>
              <Link
                href={`/admin/bookings/${booking.id}`}
                className="font-medium transition-colors hover:text-terracotta"
              >
                {booking.guest_name_snapshot}
              </Link>
              <span className="block text-xs text-ink-muted tabular-nums">
                {booking.booking_reference}
              </span>
            </Td>
            <Td className="text-sm">{booking.apartment_name_snapshot}</Td>
            <Td className="text-sm">
              {kind === "arrival" ? (
                `${booking.nights} ${booking.nights === 1 ? "night" : "nights"}`
              ) : booking.balance > 0 ? (
                <Tag tone="red">{formatMoney(booking.balance, currency)}</Tag>
              ) : (
                <Tag tone="green">Settled</Tag>
              )}
            </Td>
            <Td>
              <StatusPill status={booking.booking_status} />
            </Td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

const EMPTY_STATS: DashboardStats = {
  pending_bookings: 0,
  confirmed_bookings: 0,
  arrivals_today: 0,
  departures_today: 0,
  current_guests: 0,
  outstanding_balance: 0,
  safari_enquiries: 0,
  transfer_requests: 0,
  unread_messages: 0,
  rooms_needing_clean: 0,
};

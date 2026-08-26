import Link from "next/link";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarOff, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusPill,
  Td,
  TableWrap,
  Th,
} from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/form";
import {
  CalendarGrid,
  CalendarLegend,
  segmentsFor,
} from "@/components/admin/calendar-grid";
import { BlockForm } from "@/components/admin/block-form";
import { deleteBlock, syncCalendarsNow } from "@/app/actions/admin/bookings";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDate, humanise, toDateKey } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Apartment, BlockedDate, Booking } from "@/lib/types";

export const metadata = { title: "Calendar" };

type View = "month" | "week" | "day";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const params = await searchParams;
  const view: View = (["month", "week", "day"] as const).includes(params.view as View)
    ? (params.view as View)
    : "month";

  const anchor = params.date ? parseISO(params.date) : new Date();
  const { start, end, title, prev, next } = windowFor(view, anchor);

  const db = supabaseAdmin();
  const [{ data: apartmentRows }, { data: bookingRows }, { data: blockRows }] =
    await Promise.all([
      db
        .from("apartments")
        .select("*")
        .neq("status", "archived")
        .order("display_order")
        .order("name"),
      db
        .from("bookings")
        .select("*")
        .in("booking_status", ["pending", "held", "confirmed", "completed"])
        .lt("check_in", toDateKey(addDays(end, 1)))
        .gt("check_out", toDateKey(start)),
      db
        .from("blocked_dates")
        .select("*")
        .lt("start_date", toDateKey(addDays(end, 1)))
        .gt("end_date", toDateKey(start)),
    ]);

  const apartments = (apartmentRows as Apartment[]) ?? [];
  const bookings = (bookingRows as Booking[]) ?? [];
  const blocks = (blockRows as BlockedDate[]) ?? [];
  const segments = segmentsFor(bookings, blocks);

  const adminBlocks = blocks
    .filter((block) => block.source === "admin")
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  const apartmentNames = new Map(apartments.map((a) => [a.id, a.name]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        subtitle="Who is in, what is blocked, and where it came from."
        actions={
          <form action={syncCalendarsNow}>
            <SubmitButton variant="outline">
              <RefreshCw size={14} strokeWidth={1.75} />
              Sync channels
            </SubmitButton>
          </form>
        }
      />

      {/* Controls -------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <NavButton
            href={`/admin/calendar?view=${view}&date=${prev}`}
            label="Previous"
          >
            <ChevronLeft size={16} strokeWidth={1.75} />
          </NavButton>
          <h2 className="min-w-44 text-center font-display text-base font-semibold">
            {title}
          </h2>
          <NavButton href={`/admin/calendar?view=${view}&date=${next}`} label="Next">
            <ChevronRight size={16} strokeWidth={1.75} />
          </NavButton>
          <Link
            href={`/admin/calendar?view=${view}`}
            className="btn btn-outline btn-sm ml-1"
          >
            Today
          </Link>
        </div>

        <nav className="flex gap-2">
          {(["month", "week", "day"] as const).map((option) => (
            <Link
              key={option}
              href={`/admin/calendar?view=${option}&date=${toDateKey(anchor)}`}
              className={cn(
                "pill border capitalize transition-colors",
                view === option
                  ? "border-ocean bg-ocean text-white"
                  : "border-line bg-white text-ink-muted hover:border-ink hover:text-ink",
              )}
            >
              {option}
            </Link>
          ))}
        </nav>
      </div>

      {/* Grid or day list ------------------------------------------------ */}
      {apartments.length === 0 ? (
        <Panel bodyClassName="">
          <EmptyState
            title="No accommodation yet"
            description="Add a room or apartment and it will appear on the calendar."
            action={
              <Link href="/admin/accommodation/new" className="btn btn-primary btn-sm">
                Add accommodation
              </Link>
            }
          />
        </Panel>
      ) : view === "day" ? (
        <DayView
          date={anchor}
          apartments={apartments}
          bookings={bookings}
          blocks={blocks}
        />
      ) : (
        <Panel bodyClassName="">
          <CalendarGrid
            apartments={apartments}
            segments={segments}
            rangeStart={start}
            rangeEnd={end}
          />
        </Panel>
      )}

      <CalendarLegend />

      {/* Blocks ---------------------------------------------------------- */}
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <Panel
          title="Blocked periods"
          description="Dates you have taken off sale yourself."
          bodyClassName=""
        >
          {adminBlocks.length === 0 ? (
            <EmptyState
              icon={<CalendarOff size={20} strokeWidth={1.4} />}
              title="Nothing blocked"
              description="Use the form to take dates off sale for maintenance or an owner stay."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Accommodation</Th>
                  <Th>From</Th>
                  <Th>Until</Th>
                  <Th>Reason</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {adminBlocks.map((block) => (
                  <tr key={block.id}>
                    <Td className="text-sm">
                      {block.apartment_id
                        ? (apartmentNames.get(block.apartment_id) ?? "—")
                        : "Whole property"}
                    </Td>
                    <Td className="text-sm whitespace-nowrap">
                      {formatDate(block.start_date)}
                    </Td>
                    <Td className="text-sm whitespace-nowrap">
                      {formatDate(block.end_date)}
                    </Td>
                    <Td>
                      <span className="text-sm">{humanise(block.reason)}</span>
                      {block.note && (
                        <span className="block text-xs text-ink-muted">{block.note}</span>
                      )}
                    </Td>
                    <Td align="right">
                      <form action={deleteBlock}>
                        <input type="hidden" name="id" value={block.id} />
                        <SubmitButton
                          variant="danger"
                          confirm="Remove this block and put the dates back on sale?"
                        >
                          Remove
                        </SubmitButton>
                      </form>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>

        <BlockForm apartments={apartments} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
function DayView({
  date,
  apartments,
  bookings,
  blocks,
}: {
  date: Date;
  apartments: Apartment[];
  bookings: Booking[];
  blocks: BlockedDate[];
}) {
  const key = toDateKey(date);

  const arrivals = bookings.filter((b) => b.check_in === key);
  const departures = bookings.filter((b) => b.check_out === key);
  const staying = bookings.filter((b) => b.check_in < key && b.check_out > key);

  return (
    <div className="space-y-6">
      <Panel bodyClassName="p-5">
        <div className="grid gap-5 sm:grid-cols-3">
          <DayStat label="Arriving" value={arrivals.length} />
          <DayStat label="Departing" value={departures.length} />
          <DayStat label="Staying over" value={staying.length} />
        </div>
      </Panel>

      <Panel title={`Rooms on ${formatDate(key, "EEEE d MMMM")}`} bodyClassName="">
        <TableWrap>
          <thead>
            <tr>
              <Th>Accommodation</Th>
              <Th>Occupancy</Th>
              <Th>Guest</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {apartments.map((apartment) => {
              const booking = bookings.find(
                (b) =>
                  b.apartment_id === apartment.id &&
                  b.check_in <= key &&
                  b.check_out > key,
              );
              const block = blocks.find(
                (k) =>
                  k.apartment_id === apartment.id &&
                  k.start_date <= key &&
                  k.end_date > key,
              );

              return (
                <tr key={apartment.id}>
                  <Td className="text-sm font-medium">{apartment.name}</Td>
                  <Td className="text-sm">
                    {booking
                      ? booking.check_in === key
                        ? "Arriving"
                        : booking.check_out === key
                          ? "Departing"
                          : "Occupied"
                      : block
                        ? humanise(block.reason)
                        : "Free"}
                  </Td>
                  <Td className="text-sm">
                    {booking ? (
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="transition-colors hover:text-terracotta"
                      >
                        {booking.guest_name_snapshot}
                      </Link>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </Td>
                  <Td>
                    {booking ? (
                      <StatusPill status={booking.booking_status} />
                    ) : block ? (
                      <StatusPill status="maintenance" />
                    ) : (
                      <StatusPill status="available" />
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </Panel>
    </div>
  );
}

function DayStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[0.7rem] tracking-[0.08em] text-ink-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------
function windowFor(view: View, anchor: Date) {
  if (view === "day") {
    return {
      start: anchor,
      end: anchor,
      title: format(anchor, "EEEE d MMMM yyyy"),
      prev: toDateKey(addDays(anchor, -1)),
      next: toDateKey(addDays(anchor, 1)),
    };
  }

  if (view === "week") {
    const start = startOfWeek(anchor, { weekStartsOn: 1 });
    const end = endOfWeek(anchor, { weekStartsOn: 1 });
    return {
      start,
      end,
      title: `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`,
      prev: toDateKey(addDays(start, -7)),
      next: toDateKey(addDays(start, 7)),
    };
  }

  const start = startOfMonth(anchor);
  const end = endOfMonth(anchor);
  return {
    start,
    end,
    title: format(anchor, "MMMM yyyy"),
    prev: toDateKey(subMonths(start, 1)),
    next: toDateKey(addMonths(start, 1)),
  };
}

function NavButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-ink-muted transition-colors hover:border-ink hover:text-ink"
    >
      {children}
    </Link>
  );
}

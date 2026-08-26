import Link from "next/link";
import { eachDayOfInterval, isSameDay, isWeekend, parseISO } from "date-fns";
import { formatDate, formatMoney, toDateKey } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Apartment, BlockedDate, Booking } from "@/lib/types";

/**
 * Apartment-by-day availability grid.
 *
 * Each row is one apartment and each column one night, so a clash is visible
 * at a glance. Colour carries the source of the occupancy — direct, Airbnb,
 * Booking.com, a hold, or a block the owner made.
 */

export interface CalendarSegment {
  key: string;
  apartmentId: string;
  start: string;
  end: string; // exclusive
  label: string;
  sublabel?: string;
  href?: string;
  kind:
    | "direct"
    | "airbnb"
    | "booking_com"
    | "hold"
    | "owner_block"
    | "maintenance"
    | "external";
}

const KIND_STYLES: Record<CalendarSegment["kind"], string> = {
  direct: "bg-ocean text-white",
  airbnb: "bg-terracotta text-white",
  booking_com: "bg-[#4a5b8c] text-white",
  hold: "bg-terracotta-soft text-terracotta-dark border border-dashed border-terracotta",
  owner_block: "bg-sand-dark text-ink",
  maintenance: "bg-[#c9584a] text-white",
  external: "bg-[#8a8172] text-white",
};

export const LEGEND: { kind: CalendarSegment["kind"]; label: string }[] = [
  { kind: "direct", label: "Direct booking" },
  { kind: "airbnb", label: "Airbnb" },
  { kind: "booking_com", label: "Booking.com" },
  { kind: "hold", label: "Pending hold" },
  { kind: "owner_block", label: "Owner block" },
  { kind: "maintenance", label: "Maintenance" },
];

export function segmentsFor(
  bookings: Booking[],
  blocks: BlockedDate[],
): CalendarSegment[] {
  const fromBookings: CalendarSegment[] = bookings.map((booking) => ({
    key: `b-${booking.id}`,
    apartmentId: booking.apartment_id ?? "",
    start: booking.check_in,
    end: booking.check_out,
    label: booking.guest_name_snapshot,
    sublabel: `${booking.booking_reference} · ${formatMoney(
      booking.total_snapshot,
      booking.currency,
      { decimals: false },
    )}`,
    href: `/admin/bookings/${booking.id}`,
    kind:
      booking.booking_status === "held" || booking.booking_status === "pending"
        ? "hold"
        : booking.source === "airbnb"
          ? "airbnb"
          : booking.source === "booking_com"
            ? "booking_com"
            : "direct",
  }));

  const fromBlocks: CalendarSegment[] = blocks.map((block) => ({
    key: `k-${block.id}`,
    apartmentId: block.apartment_id ?? "",
    start: block.start_date,
    end: block.end_date,
    label:
      block.source === "admin"
        ? blockLabel(block.reason)
        : block.source === "airbnb"
          ? "Airbnb"
          : block.source === "booking_com"
            ? "Booking.com"
            : "Unavailable",
    sublabel: block.note ?? undefined,
    kind:
      block.source === "airbnb"
        ? "airbnb"
        : block.source === "booking_com"
          ? "booking_com"
          : block.reason === "maintenance"
            ? "maintenance"
            : block.source === "admin"
              ? "owner_block"
              : "external",
  }));

  return [...fromBookings, ...fromBlocks];
}

function blockLabel(reason: BlockedDate["reason"]): string {
  switch (reason) {
    case "maintenance":
      return "Maintenance";
    case "owner_stay":
      return "Owner stay";
    case "private_event":
      return "Private event";
    case "external_ical":
      return "External booking";
    default:
      return "Blocked";
  }
}

export function CalendarGrid({
  apartments,
  segments,
  rangeStart,
  rangeEnd,
}: {
  apartments: Apartment[];
  segments: CalendarSegment[];
  rangeStart: Date;
  rangeEnd: Date;
}) {
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const today = new Date();

  // A fixed column width keeps a month readable; the grid scrolls sideways.
  const dayWidth = days.length > 20 ? 2.25 : 4.5;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: `${11 + days.length * dayWidth}rem` }}>
        {/* Header ---------------------------------------------------- */}
        <div className="flex border-b border-line">
          <div className="w-44 shrink-0 px-4 py-2.5 text-[0.7rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
            Accommodation
          </div>
          <div className="flex flex-1">
            {days.map((day) => (
              <div
                key={day.toISOString()}
                style={{ width: `${dayWidth}rem` }}
                className={cn(
                  "shrink-0 border-l border-line/60 py-2 text-center",
                  isWeekend(day) && "bg-sand-deep/50",
                  isSameDay(day, today) && "bg-ocean-soft",
                )}
              >
                <span className="block text-[0.6rem] text-ink-muted uppercase">
                  {formatDate(toDateKey(day), "EEEEE")}
                </span>
                <span
                  className={cn(
                    "block text-xs tabular-nums",
                    isSameDay(day, today) && "font-semibold text-ocean-dark",
                  )}
                >
                  {formatDate(toDateKey(day), "d")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rows ------------------------------------------------------- */}
        {apartments.map((apartment) => {
          const rowSegments = segments.filter((s) => s.apartmentId === apartment.id);

          return (
            <div key={apartment.id} className="flex border-b border-line/70">
              <div className="w-44 shrink-0 px-4 py-3">
                <Link
                  href={`/admin/accommodation/${apartment.id}`}
                  className="block truncate text-sm font-medium transition-colors hover:text-terracotta"
                >
                  {apartment.name}
                </Link>
                <span className="text-xs text-ink-muted">
                  {apartment.max_guests} guests
                </span>
              </div>

              <div className="relative flex-1">
                {/* Day cells give the row its grid lines */}
                <div className="flex h-full">
                  {days.map((day) => (
                    <div
                      key={day.toISOString()}
                      style={{ width: `${dayWidth}rem` }}
                      className={cn(
                        "h-14 shrink-0 border-l border-line/60",
                        isWeekend(day) && "bg-sand-deep/40",
                        isSameDay(day, today) && "bg-ocean-soft/40",
                      )}
                    />
                  ))}
                </div>

                {/* Occupancy bars float above the cells */}
                {rowSegments.map((segment) => {
                  const placement = place(segment, days, dayWidth);
                  if (!placement) return null;

                  const content = (
                    <span className="block truncate px-2 py-1">
                      <span className="block truncate text-[0.7rem] leading-tight font-medium">
                        {segment.label}
                      </span>
                      {segment.sublabel && days.length <= 20 && (
                        <span className="block truncate text-[0.62rem] leading-tight opacity-80">
                          {segment.sublabel}
                        </span>
                      )}
                    </span>
                  );

                  const className = cn(
                    "absolute top-2 h-10 overflow-hidden rounded-md text-left transition-opacity",
                    KIND_STYLES[segment.kind],
                    segment.href && "hover:opacity-85",
                  );

                  return segment.href ? (
                    <Link
                      key={segment.key}
                      href={segment.href}
                      title={`${segment.label} — ${formatDate(segment.start)} to ${formatDate(segment.end)}`}
                      className={className}
                      style={placement}
                    >
                      {content}
                    </Link>
                  ) : (
                    <span
                      key={segment.key}
                      title={`${segment.label} — ${formatDate(segment.start)} to ${formatDate(segment.end)}`}
                      className={className}
                      style={placement}
                    >
                      {content}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Clip a segment to the visible window and convert it to left/width in rem. */
function place(
  segment: CalendarSegment,
  days: Date[],
  dayWidth: number,
): { left: string; width: string } | null {
  const first = days[0];
  const last = days[days.length - 1];

  const start = parseISO(segment.start);
  const end = parseISO(segment.end); // exclusive

  if (end <= first || start > last) return null;

  const startIndex = Math.max(0, dayIndex(start, first));
  const endIndex = Math.min(days.length, dayIndex(end, first));
  const span = endIndex - startIndex;
  if (span <= 0) return null;

  return {
    left: `${startIndex * dayWidth + 0.125}rem`,
    width: `${span * dayWidth - 0.25}rem`,
  };
}

function dayIndex(date: Date, first: Date): number {
  return Math.round(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(first.getFullYear(), first.getMonth(), first.getDate())) /
      86_400_000,
  );
}

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {LEGEND.map((entry) => (
        <span key={entry.kind} className="inline-flex items-center gap-2 text-xs">
          <span
            className={cn("h-3 w-6 shrink-0 rounded-sm", KIND_STYLES[entry.kind])}
          />
          <span className="text-ink-muted">{entry.label}</span>
        </span>
      ))}
    </div>
  );
}

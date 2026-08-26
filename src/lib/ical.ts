import "server-only";
import ical from "node-ical";
import { format } from "date-fns";

/**
 * iCalendar import and export.
 *
 * Airbnb and Booking.com both publish an .ics feed of a listing's blocked
 * dates and consume one in return. We import theirs into `blocked_dates`
 * and export ours from `bookings` + `blocked_dates`, which keeps all three
 * channels from selling the same night twice.
 */

export interface IcalEvent {
  uid: string;
  /** Inclusive first night. */
  start: Date;
  /** Exclusive — the morning of departure, as iCal defines DTEND for dates. */
  end: Date;
  summary: string;
}

// ---------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------

/** Fetch and parse a remote feed. Never throws — returns null on failure. */
export async function fetchIcalEvents(
  url: string,
  timeoutMs = 15_000,
): Promise<IcalEvent[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "text/calendar, text/plain, */*" },
    });

    if (!response.ok) {
      console.error(`[ical] ${url} responded ${response.status}`);
      return null;
    }

    const text = await response.text();
    if (!text.includes("BEGIN:VCALENDAR")) {
      console.error(`[ical] ${url} did not return a calendar`);
      return null;
    }

    return parseIcal(text);
  } catch (error) {
    console.error(`[ical] failed to fetch ${url}`, error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function parseIcal(text: string): IcalEvent[] {
  const parsed = ical.parseICS(text);
  const events: IcalEvent[] = [];

  for (const value of Object.values(parsed)) {
    if (!value || value.type !== "VEVENT") continue;

    const start = value.start ? new Date(value.start) : null;
    const end = value.end ? new Date(value.end) : null;
    if (!start || !end || Number.isNaN(+start) || Number.isNaN(+end)) continue;

    // A zero-length or reversed event tells us nothing about availability.
    if (+end <= +start) continue;

    events.push({
      uid: String(value.uid ?? `${+start}-${+end}`),
      start,
      end,
      summary: String(value.summary ?? "Reserved"),
    });
  }

  return events;
}

// ---------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------

export interface IcalExportEvent {
  uid: string;
  start: string; // yyyy-MM-dd
  end: string; // yyyy-MM-dd, exclusive
  summary: string;
  description?: string;
}

/**
 * Build a VCALENDAR of everything that blocks a night. Airbnb and
 * Booking.com only need the dates — guest names are deliberately omitted.
 */
export function buildIcalFeed(
  calendarName: string,
  events: IcalExportEvent[],
): string {
  const stamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Siriba Resort Watamu//Availability//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    "X-WR-TIMEZONE:Africa/Nairobi",
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compactDate(event.start)}`,
      `DTEND;VALUE=DATE:${compactDate(event.end)}`,
      `SUMMARY:${escapeText(event.summary)}`,
      ...(event.description
        ? [`DESCRIPTION:${escapeText(event.description)}`]
        : []),
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  return lines.map(foldLine).join("\r\n") + "\r\n";
}

function compactDate(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545 caps content lines at 75 octets; longer ones continue with a space. */
function foldLine(line: string): string {
  if (Buffer.byteLength(line, "utf8") <= 75) return line;

  const parts: string[] = [];
  let current = "";
  let bytes = 0;

  for (const char of line) {
    const size = Buffer.byteLength(char, "utf8");
    // Continuation lines start with a space, so they hold one byte less.
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  if (current) parts.push(current);

  return parts.map((part, i) => (i === 0 ? part : ` ${part}`)).join("\r\n");
}

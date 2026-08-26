// Minimal iCalendar (RFC 5545) generation — just enough for a read-only
// busy/free export feed, which is all Airbnb/Booking.com's "import
// calendar" features need.

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function toIcalDate(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

function toIcalTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export type IcalEvent = {
  uid: string;
  startDate: string; // YYYY-MM-DD, inclusive
  endDate: string; // YYYY-MM-DD, EXCLUSIVE (day guest checks out / block ends)
  summary: string;
};

export function buildIcalFeed(calendarName: string, events: IcalEvent[]): string {
  const now = toIcalTimestamp(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Siriba Resort//Booking Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    ...events.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${toIcalDate(event.startDate)}`,
      `DTEND;VALUE=DATE:${toIcalDate(event.endDate)}`,
      `SUMMARY:${escapeText(event.summary)}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  // iCal spec requires CRLF line endings.
  return lines.join("\r\n");
}

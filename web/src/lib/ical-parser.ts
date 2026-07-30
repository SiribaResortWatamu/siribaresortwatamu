// Minimal iCalendar VEVENT parser — deliberately not a full RFC 5545
// implementation (no RRULE/timezone handling). Airbnb and Booking.com's
// exported "busy" calendars are just a flat list of non-recurring VEVENTs
// with DATE or DATE-TIME start/end, which is all this needs to handle.

export type ParsedIcalEvent = {
  uid: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD, exclusive (matches DTEND semantics)
};

function toDateOnly(rawValue: string): string {
  // Handles "20260801", "20260801T000000Z", "20260801T000000" — first 8
  // digits are always YYYYMMDD regardless of DATE vs DATE-TIME form.
  const digits = rawValue.replace(/[^0-9]/g, "").slice(0, 8);
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

export function parseIcal(icsText: string): ParsedIcalEvent[] {
  // Unfold folded lines (RFC 5545: a line starting with a space/tab is a
  // continuation of the previous line) before splitting into logical lines.
  const unfolded = icsText.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = unfolded.split(/\r\n|\n/);

  const events: ParsedIcalEvent[] = [];
  let current: Partial<ParsedIcalEvent> | null = null;

  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      current = {};
      continue;
    }
    if (line.startsWith("END:VEVENT")) {
      if (current?.uid && current.start && current.end) {
        events.push(current as ParsedIcalEvent);
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).split(";")[0].toUpperCase();
    const value = line.slice(colonIndex + 1).trim();

    if (key === "UID") current.uid = value;
    else if (key === "DTSTART") current.start = toDateOnly(value);
    else if (key === "DTEND") current.end = toDateOnly(value);
  }

  return events;
}

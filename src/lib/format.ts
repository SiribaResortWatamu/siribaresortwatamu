import { format, parseISO } from "date-fns";

/**
 * Money is stored as a plain number with a currency code alongside it.
 * `KES 12,500` reads better on this site than the `Ksh` symbol form, so
 * the code is used as the prefix throughout.
 */
export function formatMoney(
  amount: number | null | undefined,
  currency = "KES",
  options: { decimals?: boolean } = {},
): string {
  const value = Number(amount ?? 0);
  const decimals = options.decimals ?? !Number.isInteger(value);
  return `${currency} ${value.toLocaleString("en-KE", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })}`;
}

/** A date-only column (`2026-08-26`) rendered for guests. */
export function formatDate(value: string | Date | null | undefined, pattern = "d MMM yyyy"): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, pattern);
}

export function formatDateLong(value: string | Date | null | undefined): string {
  return formatDate(value, "EEEE d MMMM yyyy");
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, "d MMM yyyy, HH:mm");
}

/** `14:30:00` -> `14:30`. */
export function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 5);
}

/** `partially_paid` -> `Partially paid`. */
export function humanise(value: string | null | undefined): string {
  if (!value) return "—";
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Relative wording for the activity feed: "12 minutes ago". */
export function timeAgo(value: string | Date): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${pluralise(minutes, "minute")} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${pluralise(hours, "hour")} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${pluralise(days, "day")} ago`;
  return formatDate(date);
}

/** `2026-08-26` from a Date, in local time (never shifted by UTC). */
export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

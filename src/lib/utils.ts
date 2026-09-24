import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * A search term, safe to drop into a PostgREST `.or()` filter.
 *
 * PostgREST parses `,` `.` `(` and `)` as filter syntax, so interpolating a
 * raw term lets whatever someone types become extra conditions — searching
 * for `a,id.gt.0` would widen the query rather than match a name. Wrapping
 * the value in double quotes takes those characters out of the grammar;
 * inside quotes only a backslash and a double quote still need escaping.
 *
 * Always use this for the value half of a filter built by hand. The typed
 * builders (`.eq()`, `.ilike()`, …) escape their own arguments.
 */
export function filterTerm(raw: string): string {
  const escaped = raw.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"%${escaped}%"`;
}

/** Turn any title into a clean, URL-safe slug. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Split a textarea of one-item-per-line into a trimmed array. */
export function linesToArray(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function arrayToLines(value: string[] | null | undefined): string {
  return (value ?? []).join("\n");
}

/** Split CMS body copy into paragraphs for rendering. */
export function paragraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

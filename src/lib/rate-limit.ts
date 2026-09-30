import "server-only";
import { headers } from "next/headers";

/**
 * Per-IP throttle for the public forms.
 *
 * Every public action writes a row and sends mail through Resend, and a
 * website booking is inserted as `held`, which blocks those nights straight
 * away. Unthrottled, a script can hold every apartment across every date, or
 * make this domain email arbitrary addresses until the sending reputation is
 * ruined. A honeypot stops the naive bots; this covers the rest.
 *
 * Be clear about what this is: the counter lives in the memory of one
 * serverless instance. Vercel runs several and recycles them, so a
 * determined attacker spraying requests will land on fresh instances and get
 * a fresh allowance. It is a speed bump, not a wall — enough for scrapers,
 * accidental double-submits and casual abuse.
 *
 * The durable version is a table keyed on ip + window with a insert-on-
 * conflict-increment, which survives instance churn. That needs a migration,
 * so it is a deliberate next step rather than something done quietly here.
 */

const WINDOW_MS = 10 * 60_000;
const MAX_IN_WINDOW = 5;
/** Stop the map growing without bound on a long-lived instance. */
const MAX_TRACKED_KEYS = 5_000;

const hits = new Map<string, number[]>();

/** Caller's IP as far as the proxy in front of us reports it. */
async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * True when this caller has already used up the window, in which case the
 * action should bail out before touching the database or sending anything.
 *
 * `bucket` separates the forms, so someone enquiring about a safari has not
 * spent their allowance for making a booking.
 */
export async function overRateLimit(bucket: string): Promise<boolean> {
  const ip = await clientIp();

  // An unidentifiable caller is not throttled: behind a proxy that strips
  // the header they would all share one bucket and block each other.
  if (ip === "unknown") return false;

  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_IN_WINDOW) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);

  if (hits.size > MAX_TRACKED_KEYS) pruneExpired(now);

  return false;
}

function pruneExpired(now: number): void {
  for (const [key, times] of hits) {
    const live = times.filter((t) => now - t < WINDOW_MS);
    if (live.length === 0) hits.delete(key);
    else hits.set(key, live);
  }
}

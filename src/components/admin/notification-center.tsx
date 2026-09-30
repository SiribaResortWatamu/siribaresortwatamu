"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, BellRing } from "lucide-react";
import type { NotificationItem } from "@/app/admin/api/notifications/route";

/**
 * Desktop notifications for new bookings, enquiries, transfer requests and
 * messages.
 *
 * The dashboard polls a small endpoint while it is open — a background or
 * minimised tab is fine, a closed browser is not. Each poll also refreshes
 * the session cookie (the endpoint is inside the middleware's matcher), so
 * a dashboard left open all day stays signed in.
 *
 * Progress is kept in localStorage: a cursor for "what have I already been
 * told about", plus the ids of recent items, so an overlap between polls or
 * two open tabs never produces the same notification twice.
 */

const POLL_MS = 30_000;
const CURSOR_KEY = "siriba:notify:cursor";
const SEEN_KEY = "siriba:notify:seen";
// Re-ask for a little before the cursor so nothing is lost to clock skew or
// a row that committed just after the previous poll ran.
const OVERLAP_MS = 60_000;
// Never replay more than a day of history after a long absence.
const MAX_LOOKBACK_MS = 24 * 60 * 60 * 1000;

type Permission = NotificationPermission | "unsupported";

// The browser owns the permission; this just lets React re-render when we
// change it. The server snapshot is "default" so the first paint matches.
const listeners = new Set<() => void>();
const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};
const getPermission = (): Permission =>
  typeof Notification === "undefined" ? "unsupported" : Notification.permission;
const getServerPermission = (): Permission => "default";

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: notifications still work, they may
    // just repeat after a reload.
  }
}

export function NotificationCenter() {
  const router = useRouter();
  const permission = useSyncExternalStore(subscribe, getPermission, getServerPermission);

  const show = useCallback(
    (title: string, body: string, href: string, tag: string) => {
      if (getPermission() !== "granted") return;
      try {
        const notification = new Notification(title, {
          body,
          tag,
          icon: "/logo.png",
        });
        notification.onclick = () => {
          window.focus();
          router.push(href);
          notification.close();
        };
      } catch {
        // Some browsers only allow notifications from a service worker.
      }
    },
    [router],
  );

  const poll = useCallback(async () => {
    const stored = readStorage(CURSOR_KEY);
    const floor = Date.now() - MAX_LOOKBACK_MS;
    const since = stored ? new Date(Math.max(Date.parse(stored) - OVERLAP_MS, floor)) : null;

    let data: { ok: boolean; serverTime: string; items: NotificationItem[] };
    try {
      const response = await fetch(
        since
          ? `/admin/api/notifications?since=${encodeURIComponent(since.toISOString())}`
          : "/admin/api/notifications",
        { cache: "no-store", credentials: "same-origin" },
      );
      if (!response.ok) return;
      data = await response.json();
    } catch {
      return; // Offline or a blip — the next poll will catch up.
    }

    writeStorage(CURSOR_KEY, data.serverTime);
    if (!since) return; // First run: we only wanted a starting point.

    let seen: string[] = [];
    try {
      seen = JSON.parse(readStorage(SEEN_KEY) ?? "[]");
    } catch {
      seen = [];
    }

    const fresh = data.items.filter((item) => !seen.includes(item.id));
    if (fresh.length === 0) return;

    writeStorage(SEEN_KEY, JSON.stringify([...fresh.map((i) => i.id), ...seen].slice(0, 100)));

    if (fresh.length <= 3) {
      for (const item of fresh) show(item.title, item.body, item.href, item.id);
    } else {
      show(
        `${fresh.length} new items`,
        fresh
          .slice(0, 3)
          .map((i) => i.title)
          .join(", ") + "…",
        "/admin",
        "siriba-summary",
      );
    }

    // Server-rendered badge counts in the nav are now stale.
    router.refresh();
  }, [router, show]);

  useEffect(() => {
    if (permission === "unsupported") return;

    void poll();
    const timer = window.setInterval(() => void poll(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, [permission, poll]);

  async function enable() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    listeners.forEach((callback) => callback());
    if (result === "granted") {
      show(
        "Desktop notifications are on",
        "You'll be told when a booking, enquiry, transfer or message arrives.",
        "/admin",
        "siriba-welcome",
      );
    }
  }

  if (permission === "unsupported") return null;

  if (permission === "granted") {
    return (
      <p className="flex items-center gap-2 px-3 py-2 text-xs text-ink-muted">
        <BellRing size={14} strokeWidth={1.5} className="text-ocean" />
        Desktop notifications on
      </p>
    );
  }

  if (permission === "denied") {
    return (
      <p className="flex items-start gap-2 px-3 py-2 text-xs text-ink-muted">
        <BellOff size={14} strokeWidth={1.5} className="mt-0.5 shrink-0" />
        Notifications are blocked. Allow them for this site in your browser&rsquo;s site
        settings.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={enable}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-sand-deep hover:text-ink"
    >
      <Bell size={16} strokeWidth={1.5} />
      Turn on desktop notifications
    </button>
  );
}

import { NextResponse, type NextRequest } from "next/server";
import { getAdminAccess } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * What has arrived since a given moment, for the dashboard's desktop
 * notifications.
 *
 * It lives under /admin on purpose: the middleware matcher covers this
 * path, so every poll also refreshes the session cookie. That is what keeps
 * an idle dashboard tab signed in.
 */

export interface NotificationItem {
  id: string;
  kind: "booking" | "enquiry" | "transfer" | "message";
  title: string;
  body: string;
  href: string;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  const access = await getAdminAccess();
  if (access.status !== "admin") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const serverTime = new Date().toISOString();
  const raw = request.nextUrl.searchParams.get("since");
  const parsed = raw ? new Date(raw) : null;

  // First ever poll: nothing to report, just hand back a starting point.
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return NextResponse.json({ ok: true, serverTime, items: [] });
  }
  const since = parsed.toISOString();

  const db = supabaseAdmin();
  const [bookings, enquiries, transfers, messages] = await Promise.all([
    db
      .from("bookings")
      .select("id, booking_reference, guest_name_snapshot, apartment_name_snapshot, check_in, created_at")
      .gt("created_at", since)
      // Bookings staff typed in themselves are not news to them.
      .neq("source", "admin")
      .order("created_at", { ascending: false })
      .limit(10),
    db
      .from("safari_enquiries")
      .select("id, name, safari_name_snapshot, created_at")
      .gt("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10),
    db
      .from("transfer_bookings")
      .select("id, passenger_name, transfer_name_snapshot, transfer_date, created_at")
      .gt("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10),
    db
      .from("messages")
      .select("id, name, subject, created_at")
      .gt("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const items: NotificationItem[] = [
    ...(bookings.data ?? []).map((b) => ({
      id: `booking:${b.id}`,
      kind: "booking" as const,
      title: "New booking",
      body: `${b.guest_name_snapshot} · ${b.apartment_name_snapshot} · ${formatDate(b.check_in)}`,
      href: `/admin/bookings/${b.id}`,
      createdAt: b.created_at as string,
    })),
    ...(enquiries.data ?? []).map((e) => ({
      id: `enquiry:${e.id}`,
      kind: "enquiry" as const,
      title: "New safari enquiry",
      body: `${e.name} · ${e.safari_name_snapshot}`,
      href: `/admin/safaris/enquiries/${e.id}`,
      createdAt: e.created_at as string,
    })),
    ...(transfers.data ?? []).map((t) => ({
      id: `transfer:${t.id}`,
      kind: "transfer" as const,
      title: "New transfer request",
      body: `${t.passenger_name} · ${t.transfer_name_snapshot} · ${formatDate(t.transfer_date)}`,
      href: `/admin/transfers/requests/${t.id}`,
      createdAt: t.created_at as string,
    })),
    ...(messages.data ?? []).map((m) => ({
      id: `message:${m.id}`,
      kind: "message" as const,
      title: "New message",
      body: `${m.name}${m.subject ? ` · ${m.subject}` : ""}`,
      href: "/admin/messages",
      createdAt: m.created_at as string,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ ok: true, serverTime, items });
}

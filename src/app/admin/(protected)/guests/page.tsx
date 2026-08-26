import Link from "next/link";
import { Search, Users } from "lucide-react";
import {
  EmptyState,
  PageHeader,
  Panel,
  Tag,
  Td,
  TableWrap,
  Th,
} from "@/components/admin/ui";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDate, formatMoney } from "@/lib/format";
import type { Booking, Guest } from "@/lib/types";

export const metadata = { title: "Guests" };

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const db = supabaseAdmin();

  let query = db.from("guests").select("*").order("created_at", { ascending: false });

  if (q.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
  }

  const { data: guestRows } = await query.limit(200);
  const guests = (guestRows as Guest[]) ?? [];

  // One query for every guest's history, rather than one per row.
  const { data: bookingRows } = await db
    .from("bookings")
    .select("guest_id, check_in, total_snapshot, currency, booking_status")
    .in("guest_id", guests.map((g) => g.id).length ? guests.map((g) => g.id) : ["none"]);

  const bookings = (bookingRows as Booking[]) ?? [];
  const summary = new Map<string, { stays: number; spend: number; last: string | null }>();

  for (const booking of bookings) {
    if (!booking.guest_id) continue;
    const current = summary.get(booking.guest_id) ?? { stays: 0, spend: 0, last: null };
    const counts = ["confirmed", "completed"].includes(booking.booking_status);
    summary.set(booking.guest_id, {
      stays: current.stays + (counts ? 1 : 0),
      spend: current.spend + (counts ? Number(booking.total_snapshot) : 0),
      last:
        !current.last || booking.check_in > current.last ? booking.check_in : current.last,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guests"
        subtitle="Everyone who has booked or enquired, and what they have stayed in."
      />

      <form className="flex max-w-md gap-2" action="/admin/guests">
        <input
          name="q"
          defaultValue={q}
          className="input"
          placeholder="Search name, email or phone…"
          aria-label="Search guests"
        />
        <button type="submit" className="btn btn-outline btn-sm shrink-0">
          <Search size={14} strokeWidth={1.75} />
          Search
        </button>
      </form>

      <Panel bodyClassName="">
        {guests.length === 0 ? (
          <EmptyState
            icon={<Users size={20} strokeWidth={1.4} />}
            title={q ? "No guests match" : "No guests yet"}
            description={
              q
                ? `Nothing found for “${q}”.`
                : "A guest record is created the first time someone books or enquires."
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Guest</Th>
                <Th>Contact</Th>
                <Th>Stays</Th>
                <Th align="right">Total spend</Th>
                <Th>Last stay</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => {
                const stats = summary.get(guest.id);

                return (
                  <tr key={guest.id}>
                    <Td>
                      <Link
                        href={`/admin/guests/${guest.id}`}
                        className="font-medium transition-colors hover:text-terracotta"
                      >
                        {guest.name}
                      </Link>
                      {guest.country && (
                        <span className="block text-xs text-ink-muted">
                          {guest.country}
                        </span>
                      )}
                    </Td>
                    <Td className="text-sm">
                      <span className="block truncate">{guest.email}</span>
                      {guest.phone && (
                        <span className="block text-xs text-ink-muted">
                          {guest.phone}
                        </span>
                      )}
                    </Td>
                    <Td>
                      {stats?.stays ? (
                        <Tag tone={stats.stays > 1 ? "green" : "ocean"}>
                          {stats.stays} {stats.stays === 1 ? "stay" : "stays"}
                        </Tag>
                      ) : (
                        <span className="text-xs text-ink-muted">Enquiry only</span>
                      )}
                    </Td>
                    <Td align="right" className="text-sm whitespace-nowrap">
                      {stats?.spend
                        ? formatMoney(stats.spend, "KES", { decimals: false })
                        : "—"}
                    </Td>
                    <Td className="text-sm whitespace-nowrap">
                      {stats?.last ? formatDate(stats.last) : "—"}
                    </Td>
                    <Td align="right">
                      <Link
                        href={`/admin/guests/${guest.id}`}
                        className="btn btn-outline btn-sm"
                      >
                        Open
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
}

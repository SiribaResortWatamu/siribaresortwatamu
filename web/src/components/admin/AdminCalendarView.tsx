"use client";

import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { FaTrash } from "react-icons/fa6";
import { addBlockedDate, removeBlockedDate } from "@/lib/actions/blocked-dates";
import type { BookingWithApartment, BlockedDateWithApartment } from "@/lib/admin-data";
import type { Apartment } from "@/lib/supabase/types";

const STATUS_COLOR: Record<string, string> = {
  confirmed: "#28a745",
  pending: "#f0ad4e",
  cancelled: "#dc3545",
};

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function AdminCalendarView({
  bookings,
  blockedDates,
  apartments,
}: {
  bookings: BookingWithApartment[];
  blockedDates: BlockedDateWithApartment[];
  apartments: Pick<Apartment, "id" | "name">[];
}) {
  const [form, setForm] = useState({
    apartmentId: "all",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const events = useMemo(() => {
    const bookingEvents = bookings
      .filter((b) => b.status !== "cancelled")
      .map((b) => ({
        id: `booking-${b.id}`,
        title: `${(b.apartments?.name ?? "Unknown").slice(0, 15)} - ${b.guest_name}`,
        start: b.arrival,
        end: b.departure,
        backgroundColor: STATUS_COLOR[b.status],
        borderColor: STATUS_COLOR[b.status],
      }));

    const blockEvents = blockedDates.map((b) => ({
      id: `block-${b.id}`,
      title: `${b.apartments?.name ?? "ALL BLOCKED"}${b.reason ? `: ${b.reason}` : ""}`,
      start: b.start_date,
      end: addDays(b.end_date, 1),
      backgroundColor: "#343a40",
      borderColor: "#343a40",
      allDay: true,
    }));

    return [...bookingEvents, ...blockEvents];
  }, [bookings, blockedDates]);

  async function handleAddBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      setError("Pick both a start and end date.");
      return;
    }
    setSubmitting(true);
    setError("");

    const result = await addBlockedDate({
      apartmentId: form.apartmentId === "all" ? null : form.apartmentId,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason || undefined,
    });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setForm({ apartmentId: "all", startDate: "", endDate: "", reason: "" });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth" }}
          events={events}
          height="auto"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-display text-lg text-ink">Block Dates</h3>
          <form onSubmit={handleAddBlock} className="space-y-3">
            <select
              value={form.apartmentId}
              onChange={(e) => setForm((f) => ({ ...f, apartmentId: e.target.value }))}
              className="w-full rounded-lg border border-hairline px-3 py-2 text-sm"
            >
              <option value="all">All Apartments</option>
              {apartments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="rounded-lg border border-hairline px-3 py-2 text-sm"
                aria-label="Start date"
              />
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="rounded-lg border border-hairline px-3 py-2 text-sm"
                aria-label="End date"
              />
            </div>
            <input
              type="text"
              placeholder="Reason (optional)"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              className="w-full rounded-lg border border-hairline px-3 py-2 text-sm"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-terracotta px-5 py-2 text-sm font-medium text-white hover:bg-terracotta-hover disabled:opacity-60"
            >
              {submitting ? "Adding…" : "Add Blocked Range"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-display text-lg text-ink">Currently Blocked</h3>
          {blockedDates.length === 0 ? (
            <p className="text-sm text-ink-muted">No dates have been blocked.</p>
          ) : (
            <ul className="space-y-2">
              {blockedDates.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border border-hairline px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium text-ink">
                      {b.start_date} &rarr; {b.end_date}
                    </div>
                    <div className="text-xs text-ink-muted">
                      {b.apartments?.name ?? "All Apartments"}
                      {b.reason ? ` · ${b.reason}` : ""}
                    </div>
                  </div>
                  <form action={removeBlockedDate.bind(null, b.id)}>
                    <button
                      type="submit"
                      aria-label="Remove blocked range"
                      className="rounded-md border border-red-600 p-2 text-red-600 hover:bg-red-600 hover:text-white"
                    >
                      <FaTrash size={12} />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

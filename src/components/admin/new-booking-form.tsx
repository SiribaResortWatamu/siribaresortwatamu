"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { createAdminBooking } from "@/app/actions/admin/bookings";
import { IDLE } from "@/lib/action-state";
import {
  AdminField,
  FormFeedback,
  FormSection,
  SubmitButton,
} from "@/components/admin/form";
import { formatMoney, toDateKey } from "@/lib/format";
import { quoteStay } from "@/lib/pricing";
import type { Apartment } from "@/lib/types";

/**
 * Manual booking entry, for the phone and WhatsApp reservations that never
 * touch the website. The figures shown are a preview; the server recomputes
 * and the database still refuses anything that would double-book.
 */
export function NewBookingForm({ apartments }: { apartments: Apartment[] }) {
  const [state, formAction] = useActionState(createAdminBooking, IDLE);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  const today = toDateKey(new Date());
  const [apartmentId, setApartmentId] = useState(apartments[0]?.id ?? "");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const apartment = apartments.find((a) => a.id === apartmentId);

  const quote = useMemo(() => {
    if (!apartment || !checkIn || !checkOut || checkOut <= checkIn) return null;
    return quoteStay(apartment, checkIn, checkOut);
  }, [apartment, checkIn, checkOut]);

  if (apartments.length === 0) {
    return (
      <div className="panel p-8 text-center">
        <h2 className="font-display text-base font-semibold">
          No accommodation to book
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
          Create a room or apartment first, then you can take bookings against it.
        </p>
        <Link href="/admin/accommodation/new" className="btn btn-primary btn-sm mt-6">
          Add accommodation
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <FormFeedback state={state} />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="space-y-6">
          <FormSection title="Stay">
            <AdminField label="Accommodation" required error={errors.apartmentId}>
              <select
                name="apartmentId"
                value={apartmentId}
                onChange={(event) => setApartmentId(event.target.value)}
                className="select"
                required
              >
                {apartments.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                    {option.status !== "published" ? ` (${option.status})` : ""}
                  </option>
                ))}
              </select>
            </AdminField>

            <div className="grid gap-4 sm:grid-cols-3">
              <AdminField label="Check-in" required error={errors.checkIn}>
                <input
                  name="checkIn"
                  type="date"
                  className="input"
                  required
                  min={today}
                  value={checkIn}
                  onChange={(event) => setCheckIn(event.target.value)}
                />
              </AdminField>
              <AdminField label="Check-out" required error={errors.checkOut}>
                <input
                  name="checkOut"
                  type="date"
                  className="input"
                  required
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(event) => setCheckOut(event.target.value)}
                />
              </AdminField>
              <AdminField label="Guests" required error={errors.guests}>
                <select name="guests" defaultValue="2" className="select">
                  {Array.from(
                    { length: apartment?.max_guests ?? 8 },
                    (_, i) => i + 1,
                  ).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </AdminField>
            </div>

            {quote && (
              <div className="rounded-xl bg-sand-deep/70 px-4 py-3.5 text-sm">
                <div className="flex items-baseline justify-between">
                  <span className="text-ink-muted">
                    {quote.nights} {quote.nights === 1 ? "night" : "nights"} ×{" "}
                    {formatMoney(quote.rate, quote.currency, { decimals: false })}
                    {quote.cleaningFee > 0 && " + cleaning"}
                  </span>
                  <span className="font-display text-base font-semibold">
                    {formatMoney(quote.total, quote.currency)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  Suggested deposit {formatMoney(quote.depositRequired, quote.currency)}.
                  Leave the fields on the right blank to use these figures.
                </p>
                {apartment && quote.nights < apartment.min_nights && (
                  <p className="mt-2 text-xs text-terracotta-dark">
                    Note: this is under the {apartment.min_nights}-night minimum for{" "}
                    {apartment.name}. Staff bookings are allowed to override it.
                  </p>
                )}
              </div>
            )}
          </FormSection>

          <FormSection title="Guest">
            <AdminField label="Full name" required error={errors.name}>
              <input name="name" className="input" required />
            </AdminField>

            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Email" required error={errors.email}>
                <input name="email" type="email" className="input" required />
              </AdminField>
              <AdminField label="Phone" error={errors.phone}>
                <input name="phone" type="tel" className="input" />
              </AdminField>
            </div>

            <AdminField label="Special requests">
              <textarea name="specialRequests" rows={3} className="textarea" />
            </AdminField>

            <AdminField label="Internal notes" hint="not shown to the guest">
              <textarea name="notes" rows={3} className="textarea" />
            </AdminField>
          </FormSection>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <FormSection title="Booking details">
            <AdminField label="Where did it come from?">
              <select name="source" defaultValue="admin" className="select">
                <option value="admin">Added by staff</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="website">Website</option>
                <option value="airbnb">Airbnb</option>
                <option value="booking_com">Booking.com</option>
                <option value="other">Other</option>
              </select>
            </AdminField>

            <AdminField label="Status">
              <select name="bookingStatus" defaultValue="confirmed" className="select">
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="held">Held</option>
              </select>
            </AdminField>

            <AdminField
              label={`Total (${apartment?.currency ?? "KES"})`}
              hint="blank = calculated"
            >
              <input
                name="total"
                type="number"
                min={0}
                step="0.01"
                className="input"
                placeholder={quote ? String(quote.total) : ""}
              />
            </AdminField>

            <AdminField label="Deposit required" hint="blank = calculated">
              <input
                name="deposit"
                type="number"
                min={0}
                step="0.01"
                className="input"
                placeholder={quote ? String(quote.depositRequired) : ""}
              />
            </AdminField>

            <AdminField label="Already paid">
              <input
                name="amountPaid"
                type="number"
                min={0}
                step="0.01"
                defaultValue={0}
                className="input"
              />
            </AdminField>

            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <SubmitButton className="w-full">Create booking</SubmitButton>
              <Link href="/admin/bookings" className="btn btn-outline btn-sm w-full">
                Cancel
              </Link>
            </div>
          </FormSection>

          <div className="rounded-xl bg-ocean-soft/60 p-4 text-xs leading-relaxed text-ocean-dark">
            The database refuses any booking that overlaps an existing one or a blocked
            period for the same accommodation, so you cannot double-book by accident.
          </div>
        </aside>
      </div>
    </form>
  );
}

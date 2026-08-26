"use client";

import { useActionState, useMemo, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { CalendarDays, CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { addDays, parseISO, startOfDay } from "date-fns";
import { createBooking } from "@/app/actions/public";
import { IDLE } from "@/lib/action-state";
import { Price } from "@/components/site/price";
import { formatDate, formatMoney, toDateKey } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { Apartment } from "@/lib/types";

/**
 * Availability calendar and booking request form.
 *
 * The totals shown here are a preview computed from the same rate the server
 * holds. The server recalculates everything on submit — the form posts dates
 * and counts only, never a price.
 */
export function BookingWidget({
  apartment,
  unavailableDates,
  hidePrices,
  whatsapp,
  checkInTime,
  checkOutTime,
}: {
  apartment: Apartment;
  unavailableDates: string[];
  hidePrices: boolean;
  whatsapp: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
}) {
  const [state, formAction, pending] = useActionState(createBooking, IDLE);
  const [range, setRange] = useState<DateRange | undefined>();

  const today = startOfDay(new Date());
  const disabled = useMemo(
    () => [
      { before: today },
      ...unavailableDates.map((d) => parseISO(d)),
    ],
    // `today` is derived per render but only its date matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unavailableDates],
  );

  const nights =
    range?.from && range?.to
      ? Math.max(0, Math.round((+startOfDay(range.to) - +startOfDay(range.from)) / 86400000))
      : 0;

  const accommodationTotal = nights * apartment.nightly_rate;
  const total = nights > 0 ? accommodationTotal + apartment.cleaning_fee : 0;
  const deposit = Math.round((total * apartment.deposit_percent) / 100);
  const tooShort = nights > 0 && nights < apartment.min_nights;

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  const wa = whatsappLink(
    whatsapp,
    `Hello! I'd like to enquire about the ${apartment.name}${
      range?.from ? ` from ${formatDate(toDateKey(range.from))}` : ""
    }${range?.to ? ` to ${formatDate(toDateKey(range.to))}` : ""}.`,
  );

  // -------------------------------------------------------------------
  // Confirmation
  // -------------------------------------------------------------------
  if (state.status === "success") {
    return (
      <div className="card p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ocean-soft text-ocean">
          <CheckCircle2 size={28} strokeWidth={1.4} />
        </span>
        <h3 className="mt-5 font-display text-xl font-semibold">{state.message}</h3>
        {state.reference && (
          <p className="mt-2 text-sm text-ink-muted">
            Reference{" "}
            <span className="font-medium text-ink tabular-nums">{state.reference}</span>
          </p>
        )}
        {state.detail && (
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">{state.detail}</p>
        )}
        <p className="mt-4 text-sm leading-relaxed text-ink-muted">
          A confirmation email is on its way. Nothing has been charged.
        </p>
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp mt-7 w-full"
          >
            <WhatsAppIcon size={16} />
            Message us on WhatsApp
          </a>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Form
  // -------------------------------------------------------------------
  return (
    <form action={formAction} className="card">
      <input type="hidden" name="apartmentId" value={apartment.id} />
      <input
        type="hidden"
        name="checkIn"
        value={range?.from ? toDateKey(range.from) : ""}
      />
      <input type="hidden" name="checkOut" value={range?.to ? toDateKey(range.to) : ""} />

      <div className="border-b border-line bg-sand-deep/60 px-6 py-5">
        {hidePrices ? (
          <p className="font-display text-xl font-semibold text-ocean">
            Enquire for rates
          </p>
        ) : (
          <Price
            amount={apartment.nightly_rate}
            currency={apartment.currency}
            hidden={false}
            suffix="/ night"
            size="lg"
          />
        )}
        <p className="mt-1.5 text-xs text-ink-muted">
          {apartment.min_nights > 1
            ? `Minimum ${apartment.min_nights} nights · `
            : ""}
          Rate is per apartment, not per person
        </p>
      </div>

      {/* Calendar ------------------------------------------------------ */}
      <div className="border-b border-line px-4 py-5">
        <div className="mb-3 flex items-center gap-2 px-2">
          <CalendarDays size={15} strokeWidth={1.6} className="text-ocean" />
          <p className="text-xs font-medium tracking-[0.1em] text-ink-muted uppercase">
            Choose your dates
          </p>
        </div>

        <DayPicker
          mode="range"
          selected={range}
          onSelect={setRange}
          disabled={disabled}
          excludeDisabled
          startMonth={today}
          endMonth={addDays(today, 550)}
          numberOfMonths={1}
          weekStartsOn={1}
          className="mx-auto w-fit"
        />

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[0.7rem] text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ocean" /> Selected
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sand-dark" /> Unavailable
          </span>
        </div>

        {range?.from && (
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-sand-deep/70 p-3.5">
            <StayCell
              label="Check-in"
              date={range.from}
              time={checkInTime}
            />
            <StayCell label="Check-out" date={range.to} time={checkOutTime} />
          </div>
        )}
      </div>

      {/* Price breakdown ---------------------------------------------- */}
      {nights > 0 && !hidePrices && (
        <dl className="space-y-2.5 border-b border-line px-6 py-5 text-sm">
          <Line
            label={`${formatMoney(apartment.nightly_rate, apartment.currency)} × ${nights} night${nights === 1 ? "" : "s"}`}
            value={formatMoney(accommodationTotal, apartment.currency)}
          />
          {apartment.cleaning_fee > 0 && (
            <Line
              label="Cleaning fee"
              value={formatMoney(apartment.cleaning_fee, apartment.currency)}
            />
          )}
          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <dt className="font-medium">Total</dt>
            <dd className="font-display text-lg font-semibold">
              {formatMoney(total, apartment.currency)}
            </dd>
          </div>
          {deposit > 0 && (
            <p className="pt-1 text-xs text-ink-muted">
              {formatMoney(deposit, apartment.currency)} deposit confirms your dates. The
              balance is settled on arrival.
            </p>
          )}
        </dl>
      )}

      {tooShort && (
        <Notice tone="warn">
          {apartment.name} has a minimum stay of {apartment.min_nights} nights.
        </Notice>
      )}

      {/* Guest details -------------------------------------------------- */}
      <div className="space-y-4 px-6 py-6">
        <Field label="Guests" error={errors.guests}>
          <select name="guests" defaultValue="2" className="select" required>
            {Array.from({ length: apartment.max_guests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Full name" error={errors.name}>
          <input name="name" className="input" required autoComplete="name" />
        </Field>

        <Field label="Email" error={errors.email}>
          <input
            name="email"
            type="email"
            className="input"
            required
            autoComplete="email"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" error={errors.phone}>
            <input name="phone" type="tel" className="input" autoComplete="tel" />
          </Field>
          <Field label="WhatsApp" hint="optional" error={errors.whatsapp}>
            <input name="whatsapp" type="tel" className="input" />
          </Field>
        </div>

        <Field label="Special requests" hint="optional" error={errors.specialRequests}>
          <textarea
            name="specialRequests"
            className="textarea"
            rows={3}
            placeholder="Arrival time, cot needed, dietary notes…"
          />
        </Field>

        {(errors.checkIn || errors.checkOut) && (
          <p className="field-error">
            {errors.checkIn ?? errors.checkOut}
          </p>
        )}

        {state.status === "error" && (
          <Notice tone="error" inline>
            {state.message}
          </Notice>
        )}

        <button
          type="submit"
          disabled={pending || nights === 0 || tooShort}
          className="btn btn-primary w-full"
        >
          {pending ? (
            <>
              <Loader2 size={16} className="animate-spin" strokeWidth={2} />
              Sending…
            </>
          ) : (
            "Request Booking"
          )}
        </button>

        {nights === 0 && (
          <p className="text-center text-xs text-ink-muted">
            Select your dates above to continue
          </p>
        )}

        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline w-full"
          >
            <WhatsAppIcon size={16} className="text-[#1faa54]" />
            WhatsApp Us
          </a>
        )}

        <p className="text-center text-xs leading-relaxed text-ink-muted">
          You will not be charged now. We confirm availability first.
        </p>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------
function StayCell({
  label,
  date,
  time,
}: {
  label: string;
  date: Date | undefined;
  time: string | null;
}) {
  return (
    <div>
      <p className="text-[0.65rem] tracking-[0.12em] text-ink-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-sm font-semibold">
        {date ? formatDate(toDateKey(date)) : "Select"}
      </p>
      {date && time && <p className="text-[0.7rem] text-ink-muted">from {time}</p>}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="field-label">
        {label}
        {hint && <span className="ml-1.5 font-normal text-ink-muted">({hint})</span>}
      </label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function Notice({
  tone,
  inline,
  children,
}: {
  tone: "warn" | "error";
  inline?: boolean;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "flex items-start gap-2.5 text-sm leading-relaxed",
        !inline && "border-b border-line px-6 py-4",
        tone === "error" ? "text-[#b4402c]" : "text-terracotta-dark",
        inline && "rounded-lg bg-terracotta-soft/60 px-3.5 py-3",
      )}
    >
      <TriangleAlert size={16} strokeWidth={1.6} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

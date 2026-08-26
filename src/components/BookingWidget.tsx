"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { createClient } from "@/lib/supabase/client";
import { validateName, validateEmail, validatePhone, validateFreeText } from "@/lib/client-validation";

type Props = {
  apartmentId: string;
  apartmentName: string;
  pricePerNight: number;
  showPrices?: boolean;
};

type Status = "idle" | "submitting" | "success" | "error";
type FieldName = "name" | "email" | "phone" | "requests";

function toDateString(d: Date) {
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}

// The read-side counterpart of toDateString. `new Date("2026-08-01")` parses
// a date-only string as UTC midnight, which resolves to the *previous* day
// for any guest west of UTC — so the calendar would grey out the wrong
// nights and leave a genuinely booked one selectable. Building from the
// parts gives local midnight, matching how toDateString serialises. The day
// offset goes through the constructor so month/DST rollover is handled for
// us (unlike subtracting 86400000ms).
function parseDateOnly(value: string, dayOffset = 0) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d + dayOffset);
}

function formatDisplay(d: Date | undefined) {
  if (!d) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function BookingWidget({
  apartmentId,
  apartmentName,
  pricePerNight,
  showPrices = true,
}: Props) {
  const [disabledRanges, setDisabledRanges] = useState<DateRange[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [range, setRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [guest, setGuest] = useState({
    name: "",
    email: "",
    phone: "",
    adults: 2,
    children: 0,
    requests: "",
  });
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const fieldErrors: Record<FieldName, string | null> = {
    name: validateName(guest.name),
    email: validateEmail(guest.email),
    phone: validatePhone(guest.phone, true),
    requests: validateFreeText(guest.requests, { maxLength: 2000 }),
  };

  function markTouched(field: FieldName) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  function errorFor(field: FieldName) {
    return touched[field] ? fieldErrors[field] : null;
  }

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      const supabase = createClient();
      const [blocked, booked] = await Promise.all([
        supabase
          .from("blocked_dates")
          .select("start_date, end_date, apartment_id")
          .or(`apartment_id.eq.${apartmentId},apartment_id.is.null`),
        supabase
          .from("public_apartment_unavailability")
          .select("start_date, end_date")
          .eq("apartment_id", apartmentId),
      ]);

      if (cancelled) return;

      const ranges: DateRange[] = [
        ...(blocked.data ?? []).map((b) => ({
          from: parseDateOnly(b.start_date),
          // stored inclusive — the last unavailable night
          to: parseDateOnly(b.end_date),
        })),
        ...(booked.data ?? []).map((b) => ({
          from: parseDateOnly(b.start_date),
          // stored as an exclusive end (checkout day is bookable again)
          to: parseDateOnly(b.end_date, -1),
        })),
      ];

      setDisabledRanges(ranges);
      setLoadingAvailability(false);
    }

    loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [apartmentId]);

  // Close the calendar popover on an outside click.
  useEffect(() => {
    if (!calendarOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [calendarOpen]);

  const nights = useMemo(() => {
    if (!range?.from || !range?.to) return 0;
    return Math.round((range.to.getTime() - range.from.getTime()) / 86400000);
  }, [range]);

  const total = nights * pricePerNight;

  function handleSelectRange(next: DateRange | undefined) {
    setRange(next);
    // react-day-picker sets {from: day, to: day} on the very first click, so
    // "both ends are set" alone isn't "the user is done" — only close once
    // from/to are genuinely different days (a real 1+ night stay).
    if (next?.from && next?.to && next.to.getTime() !== next.from.getTime()) {
      setCalendarOpen(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, requests: true });

    if (Object.values(fieldErrors).some(Boolean)) {
      setErrorMessage("Please fix the highlighted fields.");
      setStatus("error");
      return;
    }
    if (!range?.from || !range?.to) {
      setErrorMessage("Please select your check-in and check-out dates.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartmentId,
          arrival: toDateString(range.from),
          departure: toDateString(range.to),
          adults: guest.adults,
          children: guest.children,
          guestName: guest.name.trim(),
          guestEmail: guest.email.trim(),
          guestPhone: guest.phone.trim(),
          specialRequests: guest.requests.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl bg-sand p-6 text-center">
        <p className="font-display text-xl text-ink">Request Sent</p>
        <p className="mt-2 text-sm text-ink-muted">
          Thank you, {guest.name.split(" ")[0]}! We&apos;ve received your request for {apartmentName}
          {" "}and will confirm availability by email shortly.
        </p>
      </div>
    );
  }

  const inputClass = (field: FieldName) =>
    `w-full rounded-lg border px-3 py-2 text-sm ${
      errorFor(field) ? "border-red-400" : "border-hairline"
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {showPrices && (
        <div className="text-ink-muted">
          From <span className="font-display text-3xl text-terracotta">${pricePerNight}</span> / night
        </div>
      )}

      <div className="relative" ref={calendarRef}>
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-hairline">
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="border-r border-hairline px-3 py-2.5 text-left transition-colors hover:bg-sand"
          >
            <span className="block text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              Check-in
            </span>
            <span className="text-sm text-ink">{formatDisplay(range?.from) ?? "Add date"}</span>
          </button>
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="px-3 py-2.5 text-left transition-colors hover:bg-sand"
          >
            <span className="block text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              Check-out
            </span>
            <span className="text-sm text-ink">{formatDisplay(range?.to) ?? "Add date"}</span>
          </button>
        </div>

        {calendarOpen && (
          <div className="dp-wrap absolute z-20 mt-2 w-full min-w-[280px] overflow-x-auto rounded-xl border border-hairline bg-white p-3 shadow-lg">
            {loadingAvailability ? (
              <p className="p-2 text-sm text-ink-muted">Loading availability&hellip;</p>
            ) : (
              <DayPicker
                mode="range"
                selected={range}
                onSelect={handleSelectRange}
                disabled={[{ before: new Date() }, ...disabledRanges]}
                numberOfMonths={1}
              />
            )}
          </div>
        )}
      </div>

      {showPrices && nights > 0 && (
        <div className="rounded-lg bg-sand p-4 text-sm text-ink-muted">
          <div className="flex justify-between">
            <span>
              {nights} night{nights > 1 ? "s" : ""}
            </span>
            <span>${total}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          min={1}
          value={guest.adults}
          onChange={(e) => setGuest((g) => ({ ...g, adults: Number(e.target.value) }))}
          className="rounded-lg border border-hairline px-3 py-2 text-sm"
          aria-label="Adults"
          placeholder="Adults"
        />
        <input
          type="number"
          min={0}
          value={guest.children}
          onChange={(e) => setGuest((g) => ({ ...g, children: Number(e.target.value) }))}
          className="rounded-lg border border-hairline px-3 py-2 text-sm"
          aria-label="Children"
          placeholder="Children"
        />
      </div>

      <div>
        <input
          type="text"
          placeholder="Full Name"
          value={guest.name}
          onChange={(e) => setGuest((g) => ({ ...g, name: e.target.value }))}
          onBlur={() => markTouched("name")}
          className={inputClass("name")}
        />
        {errorFor("name") && <p className="mt-1 text-xs text-red-600">{errorFor("name")}</p>}
      </div>

      <div>
        <input
          type="email"
          placeholder="Email"
          value={guest.email}
          onChange={(e) => setGuest((g) => ({ ...g, email: e.target.value }))}
          onBlur={() => markTouched("email")}
          className={inputClass("email")}
        />
        {errorFor("email") && <p className="mt-1 text-xs text-red-600">{errorFor("email")}</p>}
      </div>

      <div>
        <input
          type="tel"
          placeholder="Phone"
          value={guest.phone}
          onChange={(e) => setGuest((g) => ({ ...g, phone: e.target.value }))}
          onBlur={() => markTouched("phone")}
          className={inputClass("phone")}
        />
        {errorFor("phone") && <p className="mt-1 text-xs text-red-600">{errorFor("phone")}</p>}
      </div>

      <div>
        <textarea
          placeholder="Special requests (optional)"
          rows={3}
          value={guest.requests}
          onChange={(e) => setGuest((g) => ({ ...g, requests: e.target.value }))}
          onBlur={() => markTouched("requests")}
          className={inputClass("requests")}
        />
        {errorFor("requests") && <p className="mt-1 text-xs text-red-600">{errorFor("requests")}</p>}
      </div>

      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-full bg-terracotta px-6 py-3 font-medium text-white transition-colors hover:bg-terracotta-hover disabled:opacity-60"
      >
        {status === "submitting" ? "Sending Request…" : "Request to Book"}
      </button>
    </form>
  );
}

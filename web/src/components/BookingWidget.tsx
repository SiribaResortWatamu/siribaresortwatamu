"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { createClient } from "@/lib/supabase/client";

type Props = {
  apartmentId: string;
  apartmentName: string;
  pricePerNight: number;
};

type Status = "idle" | "submitting" | "success" | "error";

function toDateString(d: Date) {
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}

export default function BookingWidget({ apartmentId, apartmentName, pricePerNight }: Props) {
  const [disabledRanges, setDisabledRanges] = useState<DateRange[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [range, setRange] = useState<DateRange | undefined>();
  const [guest, setGuest] = useState({
    name: "",
    email: "",
    phone: "",
    adults: 2,
    children: 0,
    requests: "",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

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
          from: new Date(b.start_date),
          to: new Date(b.end_date),
        })),
        ...(booked.data ?? []).map((b) => ({
          from: new Date(b.start_date),
          // stored as an exclusive end (checkout day is bookable again)
          to: new Date(new Date(b.end_date).getTime() - 86400000),
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

  const nights = useMemo(() => {
    if (!range?.from || !range?.to) return 0;
    return Math.round((range.to.getTime() - range.from.getTime()) / 86400000);
  }, [range]);

  const total = nights * pricePerNight;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!range?.from || !range?.to) {
      setErrorMessage("Please select your arrival and departure dates.");
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
          guestName: guest.name,
          guestEmail: guest.email,
          guestPhone: guest.phone || undefined,
          specialRequests: guest.requests || undefined,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-ink-muted">
        From <span className="font-display text-3xl text-terracotta">${pricePerNight}</span> / night
      </div>

      {loadingAvailability ? (
        <p className="text-sm text-ink-muted">Loading availability&hellip;</p>
      ) : (
        <div className="dp-wrap overflow-x-auto rounded-xl border border-hairline bg-white p-3">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={setRange}
            disabled={[{ before: new Date() }, ...disabledRanges]}
            numberOfMonths={1}
          />
        </div>
      )}

      {nights > 0 && (
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

      <input
        type="text"
        required
        placeholder="Full Name"
        value={guest.name}
        onChange={(e) => setGuest((g) => ({ ...g, name: e.target.value }))}
        className="w-full rounded-lg border border-hairline px-3 py-2 text-sm"
      />
      <input
        type="email"
        required
        placeholder="Email"
        value={guest.email}
        onChange={(e) => setGuest((g) => ({ ...g, email: e.target.value }))}
        className="w-full rounded-lg border border-hairline px-3 py-2 text-sm"
      />
      <input
        type="tel"
        placeholder="Phone (optional)"
        value={guest.phone}
        onChange={(e) => setGuest((g) => ({ ...g, phone: e.target.value }))}
        className="w-full rounded-lg border border-hairline px-3 py-2 text-sm"
      />
      <textarea
        placeholder="Special requests (optional)"
        rows={3}
        value={guest.requests}
        onChange={(e) => setGuest((g) => ({ ...g, requests: e.target.value }))}
        className="w-full rounded-lg border border-hairline px-3 py-2 text-sm"
      />

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

"use client";

import { useState } from "react";
import { validateName, validateEmail, validateFreeText } from "@/lib/client-validation";

type Props = {
  safariPackageId: string;
  safariName: string;
};

type Status = "idle" | "submitting" | "success" | "error";
type FieldName = "name" | "email" | "notes";

export default function SafariEnquiryWidget({ safariPackageId, safariName }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    travelDate: "",
    adults: 2,
    children: 0,
    notes: "",
  });
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const fieldErrors: Record<FieldName, string | null> = {
    name: validateName(form.name),
    email: validateEmail(form.email),
    notes: validateFreeText(form.notes, { maxLength: 2000 }),
  };

  function markTouched(field: FieldName) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  function errorFor(field: FieldName) {
    return touched[field] ? fieldErrors[field] : null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, notes: true });

    if (Object.values(fieldErrors).some(Boolean)) {
      setErrorMessage("Please fix the highlighted fields.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/safari-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          safariPackageId,
          travelDate: form.travelDate || undefined,
          adults: form.adults,
          children: form.children,
          guestName: form.name.trim(),
          guestEmail: form.email.trim(),
          notes: form.notes.trim() || undefined,
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
        <p className="font-display text-xl text-ink">Enquiry Sent</p>
        <p className="mt-2 text-sm text-ink-muted">
          Thank you, {form.name.split(" ")[0]}! We&apos;ll follow up by email to plan your {safariName}.
        </p>
      </div>
    );
  }

  const inputClass = (field: FieldName) =>
    `rounded-lg border px-3 py-2 text-sm ${errorFor(field) ? "border-red-400" : "border-hairline"}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            onBlur={() => markTouched("name")}
            className={`w-full ${inputClass("name")}`}
          />
          {errorFor("name") && <p className="mt-1 text-xs text-red-600">{errorFor("name")}</p>}
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            onBlur={() => markTouched("email")}
            className={`w-full ${inputClass("email")}`}
          />
          {errorFor("email") && <p className="mt-1 text-xs text-red-600">{errorFor("email")}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <input
          type="date"
          value={form.travelDate}
          onChange={(e) => setForm((f) => ({ ...f, travelDate: e.target.value }))}
          className="rounded-lg border border-hairline px-3 py-2 text-sm"
          aria-label="Preferred travel date"
        />
        <input
          type="number"
          min={1}
          value={form.adults}
          onChange={(e) => setForm((f) => ({ ...f, adults: Number(e.target.value) }))}
          className="rounded-lg border border-hairline px-3 py-2 text-sm"
          aria-label="Adults"
          placeholder="Adults"
        />
        <input
          type="number"
          min={0}
          value={form.children}
          onChange={(e) => setForm((f) => ({ ...f, children: Number(e.target.value) }))}
          className="rounded-lg border border-hairline px-3 py-2 text-sm"
          aria-label="Children"
          placeholder="Children"
        />
      </div>
      <div>
        <textarea
          placeholder="Anything else we should know? (optional)"
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          onBlur={() => markTouched("notes")}
          className={`w-full ${inputClass("notes")}`}
        />
        {errorFor("notes") && <p className="mt-1 text-xs text-red-600">{errorFor("notes")}</p>}
      </div>

      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-full bg-terracotta px-6 py-3 font-medium text-white transition-colors hover:bg-terracotta-hover disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Enquire About This Safari"}
      </button>
    </form>
  );
}

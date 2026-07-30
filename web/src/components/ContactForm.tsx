"use client";

import { useState } from "react";
import { validateName, validateEmail, validateFreeText } from "@/lib/client-validation";

type Status = "idle" | "submitting" | "success" | "error";
type FieldName = "name" | "email" | "message";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const fieldErrors: Record<FieldName, string | null> = {
    name: validateName(form.name),
    email: validateEmail(form.email),
    message: validateFreeText(form.message, { required: true, maxLength: 5000 }),
  };

  function markTouched(field: FieldName) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  function errorFor(field: FieldName) {
    return touched[field] ? fieldErrors[field] : null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, message: true });

    if (Object.values(fieldErrors).some(Boolean)) {
      setErrorMessage("Please fix the highlighted fields.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject || undefined,
          message: form.message.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
      setTouched({});
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl bg-sand p-6 text-center">
        <p className="font-display text-xl text-ink">Message Sent</p>
        <p className="mt-2 text-sm text-ink-muted">
          Thanks for reaching out — we&apos;ll get back to you shortly.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-medium text-ocean underline underline-offset-4"
        >
          Send another message
        </button>
      </div>
    );
  }

  const inputClass = (field: FieldName) =>
    `w-full rounded-lg border px-4 py-3 ${errorFor(field) ? "border-red-400" : "border-hairline"}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <input
            type="text"
            placeholder="Your Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            onBlur={() => markTouched("name")}
            className={inputClass("name")}
          />
          {errorFor("name") && <p className="mt-1 text-xs text-red-600">{errorFor("name")}</p>}
        </div>
        <div>
          <input
            type="email"
            placeholder="Your Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            onBlur={() => markTouched("email")}
            className={inputClass("email")}
          />
          {errorFor("email") && <p className="mt-1 text-xs text-red-600">{errorFor("email")}</p>}
        </div>
      </div>
      <select
        required
        value={form.subject}
        onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
        className="w-full rounded-lg border border-hairline px-4 py-3 text-ink-muted"
      >
        <option value="" disabled>
          Subject of Inquiry
        </option>
        <option value="booking">Room Booking</option>
        <option value="events">Events &amp; Weddings</option>
        <option value="general">General Information</option>
      </select>
      <div>
        <textarea
          placeholder="Your Message"
          rows={5}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          onBlur={() => markTouched("message")}
          className={inputClass("message")}
        />
        {errorFor("message") && <p className="mt-1 text-xs text-red-600">{errorFor("message")}</p>}
      </div>

      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-full bg-terracotta px-6 py-3 font-medium text-white transition-colors hover:bg-terracotta-hover disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <input
          type="text"
          required
          placeholder="Your Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="rounded-lg border border-hairline px-4 py-3"
        />
        <input
          type="email"
          required
          placeholder="Your Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="rounded-lg border border-hairline px-4 py-3"
        />
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
      <textarea
        required
        placeholder="Your Message"
        rows={5}
        value={form.message}
        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
        className="w-full rounded-lg border border-hairline px-4 py-3"
      />

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

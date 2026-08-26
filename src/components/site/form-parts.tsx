"use client";

import { CheckCircle2, TriangleAlert } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Shared form furniture for the three public enquiry forms. */

export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="field-label">
        {label}
        {hint && <span className="ml-1.5 font-normal text-ink-muted">({hint})</span>}
      </label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function FormNotice({
  tone = "error",
  children,
}: {
  tone?: "error" | "warn";
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm leading-relaxed",
        tone === "error"
          ? "bg-[#fbe9e5] text-[#b4402c]"
          : "bg-terracotta-soft/60 text-terracotta-dark",
      )}
    >
      <TriangleAlert size={16} strokeWidth={1.6} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function SuccessPanel({
  title,
  reference,
  detail,
  whatsappHref,
  className,
}: {
  title: string;
  reference?: string;
  detail?: string;
  whatsappHref?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("card p-8 text-center", className)}>
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ocean-soft text-ocean">
        <CheckCircle2 size={28} strokeWidth={1.4} />
      </span>
      <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
      {reference && (
        <p className="mt-2 text-sm text-ink-muted">
          Reference{" "}
          <span className="font-medium text-ink tabular-nums">{reference}</span>
        </p>
      )}
      {detail && <p className="mt-4 text-sm leading-relaxed text-ink-muted">{detail}</p>}
      <p className="mt-4 text-sm leading-relaxed text-ink-muted">
        A confirmation email is on its way.
      </p>
      {whatsappHref && (
        <a
          href={whatsappHref}
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

/** Name / email / phone / WhatsApp — identical across all three forms. */
export function ContactFields({
  errors,
  nameLabel = "Full name",
}: {
  errors: Record<string, string>;
  nameLabel?: string;
}) {
  return (
    <>
      <Field label={nameLabel} error={errors.name}>
        <input name="name" className="input" required autoComplete="name" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" error={errors.email}>
          <input name="email" type="email" className="input" required autoComplete="email" />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input name="phone" type="tel" className="input" autoComplete="tel" />
        </Field>
      </div>

      <Field label="WhatsApp" hint="optional" error={errors.whatsapp}>
        <input name="whatsapp" type="tel" className="input" placeholder="+254 7…" />
      </Field>
    </>
  );
}

"use client";

import { useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import type { ActionState } from "@/lib/action-state";
import { slugify } from "@/lib/utils";
import { cn } from "@/lib/utils";

/* =====================================================================
   Admin form primitives
   ===================================================================== */

export function AdminField({
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="field-label">
        {label}
        {required && <span className="ml-0.5 text-terracotta">*</span>}
        {hint && <span className="ml-1.5 font-normal text-ink-muted">{hint}</span>}
      </label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel p-5 sm:p-6", className)}>
      <div className="border-b border-line pb-4">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        {description && <p className="mt-1 text-xs text-ink-muted">{description}</p>}
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  className,
  name,
  value,
  confirm,
}: {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ocean" | "danger";
  className?: string;
  name?: string;
  value?: string;
  /** Ask before submitting — for archiving, cancelling and deleting. */
  confirm?: string;
}) {
  const { pending } = useFormStatus();

  const variants = {
    primary: "btn-primary",
    outline: "btn-outline",
    ocean: "btn-ocean",
    danger: "btn-outline border-[#d9a99f] text-[#a3402c] hover:border-[#a3402c]",
  };

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
      className={cn("btn btn-sm", variants[variant], className)}
    >
      {pending ? (
        <>
          <Loader2 size={14} className="animate-spin" strokeWidth={2} />
          Working…
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Banner showing the outcome of the last submit. */
export function FormFeedback({ state }: { state: ActionState }) {
  if (state.status === "idle") return null;

  const isError = state.status === "error";

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm",
        isError ? "bg-[#fbe1dc] text-[#a3402c]" : "bg-[#dff0e4] text-[#1f6b3a]",
      )}
    >
      {isError ? (
        <TriangleAlert size={17} strokeWidth={1.6} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={17} strokeWidth={1.6} className="mt-0.5 shrink-0" />
      )}
      <div>
        <p className="font-medium">{state.message}</p>
        {state.status === "success" && state.detail && (
          <p className="mt-0.5 opacity-80">{state.detail}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Name and slug together. The slug follows the name until the owner edits
 * it by hand, after which it is left alone — an existing page's URL should
 * never change just because someone fixed a typo in the title.
 */
export function NameAndSlug({
  namePrefix,
  defaultName = "",
  defaultSlug = "",
  basePath,
  errors = {},
}: {
  namePrefix: string;
  defaultName?: string;
  defaultSlug?: string;
  basePath: string;
  errors?: Record<string, string>;
}) {
  const [name, setName] = useState(defaultName);
  const [slug, setSlug] = useState(defaultSlug);
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultSlug));

  const effectiveSlug = slugTouched ? slug : slugify(name);

  return (
    <>
      <AdminField label={namePrefix} required error={errors.name}>
        <input
          name="name"
          className="input"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </AdminField>

      <AdminField
        label="Slug"
        hint="the web address for this page"
        required
        error={errors.slug}
      >
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm text-ink-muted">{basePath}/</span>
          <input
            name="slug"
            className="input"
            required
            value={effectiveSlug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
          />
        </div>
      </AdminField>
    </>
  );
}

/** One item per line, stored as a Postgres text[]. */
export function ListInput({
  name,
  label,
  hint,
  defaultValue = [],
  rows = 5,
  placeholder,
  error,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string[];
  rows?: number;
  placeholder?: string;
  error?: string;
}) {
  const [count, setCount] = useState(defaultValue.length);

  return (
    <AdminField
      label={label}
      hint={hint ?? "one per line"}
      error={error}
    >
      <textarea
        name={name}
        rows={rows}
        className="textarea"
        placeholder={placeholder}
        defaultValue={defaultValue.join("\n")}
        onChange={(event) =>
          setCount(event.target.value.split("\n").filter((l) => l.trim()).length)
        }
      />
      <p className="mt-1 text-xs text-ink-muted">
        {count} {count === 1 ? "item" : "items"}
      </p>
    </AdminField>
  );
}

/** Checkbox grid over the shared amenity catalogue. */
export function AmenityPicker({
  amenities,
  selected,
}: {
  amenities: { id: string; name: string }[];
  selected: string[];
}) {
  const id = useId();

  if (amenities.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No amenities have been created yet. Add some under Amenities first.
      </p>
    );
  }

  return (
    <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {amenities.map((amenity) => (
        <label
          key={amenity.id}
          htmlFor={`${id}-${amenity.id}`}
          className="flex cursor-pointer items-center gap-2.5 text-sm"
        >
          <input
            id={`${id}-${amenity.id}`}
            type="checkbox"
            name="amenityIds"
            value={amenity.id}
            defaultChecked={selected.includes(amenity.id)}
            className="h-4 w-4 shrink-0 accent-[#2c6e6b]"
          />
          {amenity.name}
        </label>
      ))}
    </div>
  );
}

/** Status select shared by every content type. */
export function StatusSelect({
  defaultValue = "draft",
  name = "status",
}: {
  defaultValue?: string;
  name?: string;
}) {
  return (
    <select name={name} defaultValue={defaultValue} className="select">
      <option value="draft">Draft — not on the website yet</option>
      <option value="published">Published — live on the website</option>
      <option value="hidden">Hidden — off the website, kept for later</option>
      <option value="archived">Archived — retired, history preserved</option>
    </select>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaPlus, FaTrash } from "react-icons/fa6";
import { createApartment, updateApartment } from "@/lib/actions/apartments";
import type { ApartmentFeature } from "@/lib/supabase/types";

type ApartmentFormValues = {
  name: string;
  slug: string;
  description: string;
  price_usd: number;
  guests: number;
  bedrooms: number;
  bathrooms: number;
  feature_on_homepage: boolean;
  sort_order: number;
  features: ApartmentFeature[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const emptyValues: ApartmentFormValues = {
  name: "",
  slug: "",
  description: "",
  price_usd: 0,
  guests: 2,
  bedrooms: 1,
  bathrooms: 1,
  feature_on_homepage: false,
  sort_order: 0,
  features: [],
};

export default function ApartmentForm({
  mode,
  apartmentId,
  initialValues,
}: {
  mode: "create" | "edit";
  apartmentId?: string;
  initialValues?: Partial<ApartmentFormValues>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ApartmentFormValues>({
    ...emptyValues,
    ...initialValues,
  });
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof ApartmentFormValues>(key: K, value: ApartmentFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleNameChange(name: string) {
    set("name", name);
    if (!slugTouched) set("slug", slugify(name));
  }

  function updateFeature(index: number, patch: Partial<ApartmentFeature>) {
    setValues((v) => ({
      ...v,
      features: v.features.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    }));
  }

  function addFeature() {
    setValues((v) => ({ ...v, features: [...v.features, { icon: "fa-star", text: "" }] }));
  }

  function removeFeature(index: number) {
    setValues((v) => ({ ...v, features: v.features.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      ...values,
      features: values.features.filter((f) => f.text.trim().length > 0),
    };

    const result =
      mode === "create"
        ? await createApartment(payload)
        : await updateApartment(apartmentId!, payload);

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push("/admin/apartments");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Name</label>
          <input
            type="text"
            required
            value={values.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full rounded-lg border border-hairline px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Slug <span className="font-normal text-ink-muted">(used in the URL)</span>
          </label>
          <input
            type="text"
            value={values.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value);
            }}
            className="w-full rounded-lg border border-hairline px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Description</label>
        <textarea
          rows={4}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className="w-full rounded-lg border border-hairline px-3 py-2"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Price (USD/night)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            required
            value={values.price_usd}
            onChange={(e) => set("price_usd", Number(e.target.value))}
            className="w-full rounded-lg border border-hairline px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Guests</label>
          <input
            type="number"
            min={1}
            required
            value={values.guests}
            onChange={(e) => set("guests", Number(e.target.value))}
            className="w-full rounded-lg border border-hairline px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Bedrooms</label>
          <input
            type="number"
            min={0}
            required
            value={values.bedrooms}
            onChange={(e) => set("bedrooms", Number(e.target.value))}
            className="w-full rounded-lg border border-hairline px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Bathrooms</label>
          <input
            type="number"
            min={0}
            required
            value={values.bathrooms}
            onChange={(e) => set("bathrooms", Number(e.target.value))}
            className="w-full rounded-lg border border-hairline px-3 py-2"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Display Order</label>
          <input
            type="number"
            value={values.sort_order}
            onChange={(e) => set("sort_order", Number(e.target.value))}
            className="w-32 rounded-lg border border-hairline px-3 py-2"
          />
        </div>
        <label className="mt-6 flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={values.feature_on_homepage}
            onChange={(e) => set("feature_on_homepage", e.target.checked)}
            className="h-4 w-4"
          />
          Feature on homepage
        </label>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-ink">Amenities</label>
          <button
            type="button"
            onClick={addFeature}
            className="flex items-center gap-1.5 rounded-full border border-terracotta px-3 py-1 text-xs font-medium text-terracotta hover:bg-terracotta hover:text-white"
          >
            <FaPlus /> Add Amenity
          </button>
        </div>
        <p className="mb-3 text-xs text-ink-muted">
          Icon is a Font Awesome class suffix, e.g. <code>fa-bed</code>, <code>fa-wifi</code>,{" "}
          <code>fa-umbrella-beach</code>.
        </p>
        <div className="space-y-2">
          {values.features.length === 0 && (
            <p className="text-sm text-ink-muted">No amenities added yet.</p>
          )}
          {values.features.map((feature, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                placeholder="fa-bed"
                value={feature.icon}
                onChange={(e) => updateFeature(i, { icon: e.target.value })}
                className="w-32 rounded-lg border border-hairline px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="3 Bedrooms (All en-suite)"
                value={feature.text}
                onChange={(e) => updateFeature(i, { text: e.target.value })}
                className="flex-1 rounded-lg border border-hairline px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeFeature(i)}
                aria-label="Remove amenity"
                className="rounded-lg border border-hairline px-3 text-red-600 hover:bg-red-50"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-terracotta px-6 py-2.5 font-medium text-white transition-colors hover:bg-terracotta-hover disabled:opacity-60"
        >
          {submitting ? "Saving…" : mode === "create" ? "Create Apartment" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/apartments")}
          className="rounded-full border border-hairline px-6 py-2.5 font-medium text-ink-muted hover:bg-sand"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

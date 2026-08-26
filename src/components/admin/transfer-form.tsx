"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { saveTransfer } from "@/app/actions/admin/content";
import { IDLE } from "@/lib/action-state";
import {
  AdminField,
  FormFeedback,
  FormSection,
  ListInput,
  NameAndSlug,
  StatusSelect,
  SubmitButton,
} from "@/components/admin/form";
import { PhotoManager } from "@/components/admin/photo-manager";
import type { PricingMethod, TransferWithPhotos } from "@/lib/types";

const SERVICE_TYPES = [
  "Airport Transfer",
  "SGR Transfer",
  "Hotel Transfer",
  "Local Taxi",
  "Airport Pickup",
  "Airport Drop-off",
  "Private Driver",
  "Vehicle Hire",
  "Excursion Transfer",
  "Custom Transfer",
];

const PRICING_METHODS: { value: PricingMethod; label: string; hint: string }[] = [
  { value: "fixed", label: "Fixed price", hint: "one price for the whole journey" },
  { value: "per_person", label: "Per person", hint: "multiplied by passengers" },
  { value: "per_vehicle", label: "Per vehicle", hint: "multiplied by vehicles" },
  { value: "hourly", label: "Hourly", hint: "multiplied by hours" },
  { value: "on_enquiry", label: "Price on enquiry", hint: "quoted case by case" },
];

export function TransferForm({ transfer }: { transfer?: TransferWithPhotos }) {
  const [state, formAction] = useActionState(saveTransfer, IDLE);
  const [method, setMethod] = useState<PricingMethod>(
    transfer?.pricing_method ?? "fixed",
  );
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const isNew = !transfer;

  const selected = PRICING_METHODS.find((m) => m.value === method);

  return (
    <form action={formAction} className="space-y-6">
      {transfer && <input type="hidden" name="id" value={transfer.id} />}

      <FormFeedback state={state} />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="space-y-6">
          <FormSection title="Basics">
            <NameAndSlug
              namePrefix="Service name"
              defaultName={transfer?.name}
              defaultSlug={transfer?.slug}
              basePath="/transfers"
              errors={errors}
            />

            <AdminField label="Service type">
              <select
                name="service_type"
                defaultValue={transfer?.service_type ?? "Airport Transfer"}
                className="select"
              >
                {SERVICE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </AdminField>

            <AdminField label="Short description" hint="used on cards">
              <textarea
                name="short_description"
                rows={2}
                className="textarea"
                defaultValue={transfer?.short_description ?? ""}
              />
            </AdminField>

            <AdminField label="Full description">
              <textarea
                name="full_description"
                rows={8}
                className="textarea"
                defaultValue={transfer?.full_description ?? ""}
              />
            </AdminField>
          </FormSection>

          <FormSection
            title="Service information"
            description="Shown in the strip beneath the page hero."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Vehicle type">
                <input
                  name="vehicle_type"
                  className="input"
                  defaultValue={transfer?.vehicle_type ?? ""}
                  placeholder="Air-conditioned minivan"
                />
              </AdminField>
              <AdminField label="Estimated journey time">
                <input
                  name="journey_time"
                  className="input"
                  defaultValue={transfer?.journey_time ?? ""}
                  placeholder="40 minutes"
                />
              </AdminField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Passenger capacity">
                <input
                  name="passenger_capacity"
                  type="number"
                  min={1}
                  className="input"
                  defaultValue={transfer?.passenger_capacity ?? 4}
                />
              </AdminField>
              <AdminField label="Luggage capacity" hint="number of items">
                <input
                  name="luggage_capacity"
                  type="number"
                  min={0}
                  className="input"
                  defaultValue={transfer?.luggage_capacity ?? 2}
                />
              </AdminField>
            </div>

            <ListInput
              name="pickup_locations"
              label="Pick-up locations"
              defaultValue={transfer?.pickup_locations}
              rows={4}
              placeholder={"Malindi Airport (MYD)\nWatamu accommodation"}
            />
            <ListInput
              name="dropoff_locations"
              label="Drop-off locations"
              defaultValue={transfer?.dropoff_locations}
              rows={4}
              placeholder={"Watamu accommodation\nMalindi Airport (MYD)"}
            />
          </FormSection>

          <FormSection
            title="Pricing"
            description="Transfer totals are worked out on the server from these figures."
          >
            <AdminField label="Pricing method">
              <select
                name="pricing_method"
                value={method}
                onChange={(event) => setMethod(event.target.value as PricingMethod)}
                className="select"
              >
                {PRICING_METHODS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {selected && (
                <p className="mt-1 text-xs text-ink-muted">{selected.hint}</p>
              )}
            </AdminField>

            {method !== "on_enquiry" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label="Price">
                  <input
                    name="price"
                    type="number"
                    min={0}
                    step="0.01"
                    className="input"
                    defaultValue={transfer?.price ?? 0}
                  />
                </AdminField>
                <AdminField label="Currency">
                  <select
                    name="currency"
                    defaultValue={transfer?.currency ?? "KES"}
                    className="select"
                  >
                    <option value="KES">KES</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </AdminField>
              </div>
            )}

            {method === "on_enquiry" && (
              <>
                <input type="hidden" name="price" value={0} />
                <input
                  type="hidden"
                  name="currency"
                  value={transfer?.currency ?? "KES"}
                />
                <p className="rounded-lg bg-sand-deep/70 px-4 py-3 text-xs text-ink-muted">
                  Guests will see &ldquo;Price on enquiry&rdquo; and you can quote each
                  journey individually from the request.
                </p>
              </>
            )}
          </FormSection>

          <FormSection title="What's included">
            <ListInput
              name="included"
              label="Included"
              defaultValue={transfer?.included}
              placeholder={"Meet and greet at arrivals\nBottled water"}
            />
            <ListInput
              name="excluded"
              label="Not included"
              defaultValue={transfer?.excluded}
              rows={4}
              placeholder={"Gratuities\nChild seat unless requested"}
            />
            <ListInput
              name="additional_charges"
              label="Additional charges"
              defaultValue={transfer?.additional_charges}
              rows={4}
              placeholder={"Night surcharge 22:00–05:00: KES 1,000\nChild seat: KES 500"}
            />
          </FormSection>

          <FormSection title="Photos">
            <PhotoManager
              folder={`transfers/${transfer?.slug ?? "new"}`}
              photos={transfer?.transfer_photos ?? []}
            />
          </FormSection>

          <FormSection
            title="Search engines"
            description="Leave blank to use the name and short description."
          >
            <AdminField label="SEO title">
              <input
                name="seo_title"
                className="input"
                maxLength={70}
                defaultValue={transfer?.seo_title ?? ""}
              />
            </AdminField>
            <AdminField label="Meta description">
              <textarea
                name="seo_description"
                rows={3}
                className="textarea"
                maxLength={200}
                defaultValue={transfer?.seo_description ?? ""}
              />
            </AdminField>
          </FormSection>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <FormSection title="Publishing">
            <AdminField label="Status">
              <StatusSelect defaultValue={transfer?.status ?? "draft"} />
            </AdminField>

            <AdminField label="Display order">
              <input
                name="display_order"
                type="number"
                className="input"
                defaultValue={transfer?.display_order ?? 0}
              />
            </AdminField>

            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                name="is_featured"
                defaultChecked={transfer?.is_featured ?? false}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#2c6e6b]"
              />
              <span>Feature on the homepage</span>
            </label>

            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <SubmitButton className="w-full">
                {isNew ? "Create service" : "Save changes"}
              </SubmitButton>

              {transfer?.status === "published" && (
                <Link
                  href={`/transfers/${transfer.slug}`}
                  target="_blank"
                  className="btn btn-outline btn-sm w-full"
                >
                  <ExternalLink size={14} strokeWidth={1.6} />
                  View live page
                </Link>
              )}

              <Link href="/admin/transfers" className="btn btn-outline btn-sm w-full">
                Cancel
              </Link>
            </div>
          </FormSection>
        </aside>
      </div>
    </form>
  );
}

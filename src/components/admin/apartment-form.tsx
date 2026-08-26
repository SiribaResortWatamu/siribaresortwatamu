"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { saveApartment } from "@/app/actions/admin/content";
import { IDLE } from "@/lib/action-state";
import {
  AdminField,
  AmenityPicker,
  FormFeedback,
  FormSection,
  NameAndSlug,
  StatusSelect,
  SubmitButton,
} from "@/components/admin/form";
import { PhotoManager } from "@/components/admin/photo-manager";
import { CopyField } from "@/components/admin/copy-field";
import type { Amenity, ApartmentWithPhotos } from "@/lib/types";

const PROPERTY_TYPES = [
  "Apartment",
  "Suite",
  "Studio",
  "Villa",
  "Cottage",
  "Room",
  "Bungalow",
];

const HOUSEKEEPING = [
  { value: "available", label: "Available" },
  { value: "occupied", label: "Occupied" },
  { value: "cleaning", label: "Cleaning" },
  { value: "ready", label: "Ready" },
  { value: "maintenance", label: "Maintenance" },
];

export function ApartmentForm({
  apartment,
  amenities,
  siteUrl,
}: {
  apartment?: ApartmentWithPhotos;
  amenities: Amenity[];
  siteUrl: string;
}) {
  const [state, formAction] = useActionState(saveApartment, IDLE);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const isNew = !apartment;

  return (
    <form action={formAction} className="space-y-6">
      {apartment && <input type="hidden" name="id" value={apartment.id} />}

      <FormFeedback state={state} />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="space-y-6">
          {/* ---------------------------------------------------------- */}
          <FormSection
            title="Basics"
            description="The name and web address for this accommodation."
          >
            <NameAndSlug
              namePrefix="Accommodation name"
              defaultName={apartment?.name}
              defaultSlug={apartment?.slug}
              basePath="/accommodation"
              errors={errors}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Property type">
                <select
                  name="property_type"
                  defaultValue={apartment?.property_type ?? "Apartment"}
                  className="select"
                >
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </AdminField>

              <AdminField label="Location" hint="shown under the title">
                <input
                  name="location"
                  className="input"
                  defaultValue={apartment?.location ?? ""}
                  placeholder="Jacaranda Road, Watamu"
                />
              </AdminField>
            </div>

            <AdminField
              label="Short description"
              hint="one sentence, used on cards and in search results"
            >
              <textarea
                name="short_description"
                rows={2}
                className="textarea"
                defaultValue={apartment?.short_description ?? ""}
              />
            </AdminField>

            <AdminField
              label="Full description"
              hint="leave a blank line between paragraphs"
            >
              <textarea
                name="full_description"
                rows={10}
                className="textarea"
                defaultValue={apartment?.full_description ?? ""}
              />
            </AdminField>
          </FormSection>

          {/* ---------------------------------------------------------- */}
          <FormSection title="The space" description="What guests see in Quick Facts.">
            <div className="grid gap-4 sm:grid-cols-4">
              <AdminField label="Max guests" required>
                <input
                  name="max_guests"
                  type="number"
                  min={1}
                  className="input"
                  defaultValue={apartment?.max_guests ?? 2}
                />
              </AdminField>
              <AdminField label="Bedrooms">
                <input
                  name="bedrooms"
                  type="number"
                  min={0}
                  className="input"
                  defaultValue={apartment?.bedrooms ?? 1}
                />
              </AdminField>
              <AdminField label="Bathrooms">
                <input
                  name="bathrooms"
                  type="number"
                  min={0}
                  className="input"
                  defaultValue={apartment?.bathrooms ?? 1}
                />
              </AdminField>
              <AdminField label="Beds">
                <input
                  name="beds"
                  type="number"
                  min={0}
                  className="input"
                  defaultValue={apartment?.beds ?? 1}
                />
              </AdminField>
            </div>
          </FormSection>

          {/* ---------------------------------------------------------- */}
          <FormSection
            title="Pricing"
            description="The server calculates every booking total from these figures."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <AdminField label="Nightly rate" required>
                <input
                  name="nightly_rate"
                  type="number"
                  min={0}
                  step="0.01"
                  className="input"
                  defaultValue={apartment?.nightly_rate ?? 0}
                />
              </AdminField>
              <AdminField label="Currency">
                <select
                  name="currency"
                  defaultValue={apartment?.currency ?? "KES"}
                  className="select"
                >
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </AdminField>
              <AdminField label="Cleaning fee" hint="added once per stay">
                <input
                  name="cleaning_fee"
                  type="number"
                  min={0}
                  step="0.01"
                  className="input"
                  defaultValue={apartment?.cleaning_fee ?? 0}
                />
              </AdminField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Minimum nights">
                <input
                  name="min_nights"
                  type="number"
                  min={1}
                  className="input"
                  defaultValue={apartment?.min_nights ?? 1}
                />
              </AdminField>
              <AdminField label="Deposit %" hint="of the total, to confirm">
                <input
                  name="deposit_percent"
                  type="number"
                  min={0}
                  max={100}
                  className="input"
                  defaultValue={apartment?.deposit_percent ?? 30}
                />
              </AdminField>
            </div>
          </FormSection>

          {/* ---------------------------------------------------------- */}
          <FormSection
            title="Amenities"
            description="Tick what this accommodation offers. Manage the list under Amenities."
          >
            <AmenityPicker
              amenities={amenities}
              selected={apartment?.amenity_ids ?? []}
            />
          </FormSection>

          {/* ---------------------------------------------------------- */}
          <FormSection
            title="Photos"
            description="The cover photo leads the listing and the page hero."
          >
            <PhotoManager
              folder={`apartments/${apartment?.slug ?? "new"}`}
              photos={apartment?.apartment_photos ?? []}
            />
          </FormSection>

          {/* ---------------------------------------------------------- */}
          <FormSection
            title="Channel calendars"
            description="Keep Airbnb and Booking.com in step with direct bookings."
          >
            <AdminField
              label="Airbnb calendar URL"
              hint="Airbnb → Listing → Availability → Sync calendars → Export"
            >
              <input
                name="airbnb_ical_url"
                type="url"
                className="input"
                defaultValue={apartment?.airbnb_ical_url ?? ""}
                placeholder="https://www.airbnb.com/calendar/ical/…"
              />
            </AdminField>

            <AdminField label="Booking.com calendar URL">
              <input
                name="booking_com_ical_url"
                type="url"
                className="input"
                defaultValue={apartment?.booking_com_ical_url ?? ""}
                placeholder="https://admin.booking.com/hotel/…ics"
              />
            </AdminField>

            {apartment ? (
              <CopyField
                label="Our calendar feed"
                hint="paste this into Airbnb and Booking.com so they block your direct bookings"
                value={`${siteUrl}/api/ical/${apartment.ical_export_token}`}
              />
            ) : (
              <p className="rounded-lg bg-sand-deep/70 px-4 py-3 text-xs text-ink-muted">
                Save this accommodation first and its outgoing calendar feed will appear
                here.
              </p>
            )}
          </FormSection>

          {/* ---------------------------------------------------------- */}
          <FormSection
            title="Search engines"
            description="Leave blank to use the name and short description."
          >
            <AdminField label="SEO title">
              <input
                name="seo_title"
                className="input"
                maxLength={70}
                defaultValue={apartment?.seo_title ?? ""}
              />
            </AdminField>
            <AdminField label="Meta description" hint="around 155 characters">
              <textarea
                name="seo_description"
                rows={3}
                className="textarea"
                maxLength={200}
                defaultValue={apartment?.seo_description ?? ""}
              />
            </AdminField>
          </FormSection>
        </div>

        {/* Sidebar ---------------------------------------------------- */}
        <aside className="space-y-6 lg:sticky lg:top-6">
          <FormSection title="Publishing">
            <AdminField label="Status">
              <StatusSelect defaultValue={apartment?.status ?? "draft"} />
            </AdminField>

            <AdminField label="Housekeeping">
              <select
                name="housekeeping"
                defaultValue={apartment?.housekeeping ?? "available"}
                className="select"
              >
                {HOUSEKEEPING.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </AdminField>

            <AdminField label="Display order" hint="lower numbers appear first">
              <input
                name="display_order"
                type="number"
                className="input"
                defaultValue={apartment?.display_order ?? 0}
              />
            </AdminField>

            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                name="is_featured"
                defaultChecked={apartment?.is_featured ?? false}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#2c6e6b]"
              />
              <span>
                Feature on the homepage
                <span className="block text-xs text-ink-muted">
                  Featured items lead the list.
                </span>
              </span>
            </label>

            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <SubmitButton className="w-full">
                {isNew ? "Create accommodation" : "Save changes"}
              </SubmitButton>

              {apartment?.status === "published" && (
                <Link
                  href={`/accommodation/${apartment.slug}`}
                  target="_blank"
                  className="btn btn-outline btn-sm w-full"
                >
                  <ExternalLink size={14} strokeWidth={1.6} />
                  View live page
                </Link>
              )}

              <Link href="/admin/accommodation" className="btn btn-outline btn-sm w-full">
                Cancel
              </Link>
            </div>
          </FormSection>

          {isNew && (
            <div className="rounded-xl bg-ocean-soft/60 p-4 text-xs leading-relaxed text-ocean-dark">
              Saving creates the public page automatically at the slug above — there is
              nothing else to set up. Leave the status on Draft until you are happy with
              it.
            </div>
          )}
        </aside>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { saveSafari } from "@/app/actions/admin/content";
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
import { ItineraryBuilder } from "@/components/admin/itinerary-builder";
import { PhotoManager } from "@/components/admin/photo-manager";
import type { SafariWithDetail } from "@/lib/types";

const SAFARI_TYPES = [
  "Group Safari",
  "Private Safari",
  "Fly-In Safari",
  "Day Trip",
  "Camping Safari",
  "Luxury Safari",
  "Family Safari",
];

export function SafariForm({ safari }: { safari?: SafariWithDetail }) {
  const [state, formAction] = useActionState(saveSafari, IDLE);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const isNew = !safari;

  return (
    <form action={formAction} className="space-y-6">
      {safari && <input type="hidden" name="id" value={safari.id} />}

      <FormFeedback state={state} />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="space-y-6">
          <FormSection title="Basics">
            <NameAndSlug
              namePrefix="Safari name"
              defaultName={safari?.name}
              defaultSlug={safari?.slug}
              basePath="/safaris"
              errors={errors}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Destination">
                <input
                  name="destination"
                  className="input"
                  defaultValue={safari?.destination ?? ""}
                  placeholder="Tsavo East National Park"
                />
              </AdminField>
              <AdminField label="Safari type">
                <select
                  name="safari_type"
                  defaultValue={safari?.safari_type ?? "Group Safari"}
                  className="select"
                >
                  {SAFARI_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </AdminField>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <AdminField label="Duration" hint="as shown to guests">
                <input
                  name="duration"
                  className="input"
                  defaultValue={safari?.duration ?? ""}
                  placeholder="2 days / 1 night"
                />
              </AdminField>
              <AdminField label="Starts at">
                <input
                  name="starting_location"
                  className="input"
                  defaultValue={safari?.starting_location ?? ""}
                  placeholder="Watamu"
                />
              </AdminField>
              <AdminField label="Ends at">
                <input
                  name="ending_location"
                  className="input"
                  defaultValue={safari?.ending_location ?? ""}
                  placeholder="Watamu"
                />
              </AdminField>
            </div>

            <AdminField label="Short description" hint="used on cards">
              <textarea
                name="short_description"
                rows={2}
                className="textarea"
                defaultValue={safari?.short_description ?? ""}
              />
            </AdminField>

            <AdminField label="Overview" hint="leave a blank line between paragraphs">
              <textarea
                name="full_description"
                rows={10}
                className="textarea"
                defaultValue={safari?.full_description ?? ""}
              />
            </AdminField>
          </FormSection>

          <FormSection title="Pricing">
            <div className="grid gap-4 sm:grid-cols-3">
              <AdminField label="Price per person">
                <input
                  name="price"
                  type="number"
                  min={0}
                  step="0.01"
                  className="input"
                  defaultValue={safari?.price ?? 0}
                />
              </AdminField>
              <AdminField label="Currency">
                <select
                  name="currency"
                  defaultValue={safari?.currency ?? "USD"}
                  className="select"
                >
                  <option value="USD">USD</option>
                  <option value="KES">KES</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </AdminField>
              <AdminField label="How to show it">
                <select
                  name="price_display_mode"
                  defaultValue={safari?.price_display_mode ?? "from_price"}
                  className="select"
                >
                  <option value="from_price">From this price</option>
                  <option value="show_price">Exact price</option>
                  <option value="on_enquiry">Price on enquiry</option>
                </select>
              </AdminField>
            </div>
          </FormSection>

          <FormSection
            title="Itinerary"
            description="Add as many days as the trip needs — there is no limit."
          >
            <ItineraryBuilder days={safari?.safari_itinerary_days ?? []} />
          </FormSection>

          <FormSection title="Highlights and inclusions">
            <ListInput
              name="highlights"
              label="Highlights"
              defaultValue={safari?.highlights}
              placeholder={"Tsavo's famous red elephants\nSunrise game drive"}
            />
            <ListInput
              name="included"
              label="What's included"
              defaultValue={safari?.included}
              placeholder={"Park entry fees\nProfessional driver-guide"}
            />
            <ListInput
              name="excluded"
              label="What's excluded"
              defaultValue={safari?.excluded}
              placeholder={"International flights\nTravel insurance"}
            />
            <ListInput
              name="optional_extras"
              label="Optional extras"
              defaultValue={safari?.optional_extras}
              rows={4}
              placeholder={"Private vehicle upgrade\nBalloon safari"}
            />
            <AdminField
              label="Important information"
              hint="requirements, luggage limits, seasonality"
            >
              <textarea
                name="important_info"
                rows={5}
                className="textarea"
                defaultValue={safari?.important_info ?? ""}
              />
            </AdminField>
          </FormSection>

          <FormSection title="Photos">
            <PhotoManager
              folder={`safaris/${safari?.slug ?? "new"}`}
              photos={safari?.safari_photos ?? []}
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
                defaultValue={safari?.seo_title ?? ""}
              />
            </AdminField>
            <AdminField label="Meta description">
              <textarea
                name="seo_description"
                rows={3}
                className="textarea"
                maxLength={200}
                defaultValue={safari?.seo_description ?? ""}
              />
            </AdminField>
          </FormSection>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <FormSection title="Publishing">
            <AdminField label="Status">
              <StatusSelect defaultValue={safari?.status ?? "draft"} />
            </AdminField>

            <AdminField label="Display order">
              <input
                name="display_order"
                type="number"
                className="input"
                defaultValue={safari?.display_order ?? 0}
              />
            </AdminField>

            <AdminField label="Days" hint="used for sorting and filters">
              <input
                name="duration_days"
                type="number"
                min={1}
                className="input"
                defaultValue={safari?.duration_days ?? 1}
              />
            </AdminField>

            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                name="is_featured"
                defaultChecked={safari?.is_featured ?? false}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#2c6e6b]"
              />
              <span>Feature on the homepage</span>
            </label>

            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <SubmitButton className="w-full">
                {isNew ? "Create safari" : "Save changes"}
              </SubmitButton>

              {safari?.status === "published" && (
                <Link
                  href={`/safaris/${safari.slug}`}
                  target="_blank"
                  className="btn btn-outline btn-sm w-full"
                >
                  <ExternalLink size={14} strokeWidth={1.6} />
                  View live page
                </Link>
              )}

              <Link href="/admin/safaris" className="btn btn-outline btn-sm w-full">
                Cancel
              </Link>
            </div>
          </FormSection>
        </aside>
      </div>
    </form>
  );
}

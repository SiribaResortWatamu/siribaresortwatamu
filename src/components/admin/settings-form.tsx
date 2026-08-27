"use client";

import { useActionState } from "react";
import { saveSettings } from "@/app/actions/admin/operations";
import { IDLE } from "@/lib/action-state";
import {
  AdminField,
  FormFeedback,
  FormSection,
  SubmitButton,
} from "@/components/admin/form";
import { LogoUpload } from "@/components/admin/logo-upload";
import type { SiteSettings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction] = useActionState(saveSettings, IDLE);

  return (
    <form action={formAction} className="space-y-6">
      <FormFeedback state={state} />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Property ---------------------------------------------------- */}
        <FormSection
          title="Property"
          description="Used in the header, footer, emails and search results."
        >
          <AdminField label="Property name" required>
            <input
              name="property_name"
              className="input"
              required
              defaultValue={settings.property_name}
            />
          </AdminField>

          <AdminField label="Tagline" hint="the headline on the homepage hero">
            <input name="tagline" className="input" defaultValue={settings.tagline ?? ""} />
          </AdminField>

          <LogoUpload
            name="logo_path"
            label="Logo"
            hint="dark artwork, shown on light backgrounds"
            defaultValue={settings.logo_path}
            fallback="/logo.png"
            preview="dark"
          />

          <LogoUpload
            name="logo_light_path"
            label="Logo (reversed)"
            hint="light artwork, for the footer and the homepage hero"
            defaultValue={settings.logo_light_path}
            fallback="/logo-light.png"
            preview="light"
          />

          <AdminField label="Address">
            <input name="address" className="input" defaultValue={settings.address ?? ""} />
          </AdminField>

          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Phone">
              <input
                name="phone"
                type="tel"
                className="input"
                defaultValue={settings.phone ?? ""}
                placeholder="+254 700 000 000"
              />
            </AdminField>
            <AdminField label="WhatsApp" hint="digits only, with country code">
              <input
                name="whatsapp"
                type="tel"
                className="input"
                defaultValue={settings.whatsapp ?? ""}
                placeholder="254700000000"
              />
            </AdminField>
          </div>

          <AdminField label="Public email">
            <input
              name="email"
              type="email"
              className="input"
              defaultValue={settings.email ?? ""}
            />
          </AdminField>

          <AdminField label="Facebook URL">
            <input
              name="facebook_url"
              type="url"
              className="input"
              defaultValue={settings.facebook_url ?? ""}
            />
          </AdminField>

          <AdminField label="Instagram URL">
            <input
              name="instagram_url"
              type="url"
              className="input"
              defaultValue={settings.instagram_url ?? ""}
            />
          </AdminField>

          <AdminField label="TripAdvisor URL">
            <input
              name="tripadvisor_url"
              type="url"
              className="input"
              defaultValue={settings.tripadvisor_url ?? ""}
            />
          </AdminField>

          <AdminField
            label="Map embed URL"
            hint="Google Maps → Share → Embed a map → copy the src"
          >
            <input
              name="map_embed_url"
              type="url"
              className="input"
              defaultValue={settings.map_embed_url ?? ""}
            />
          </AdminField>
        </FormSection>

        <div className="space-y-6">
          {/* Booking --------------------------------------------------- */}
          <FormSection
            title="Booking"
            description="How stays are quoted, held and confirmed."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Default currency">
                <select
                  name="default_currency"
                  defaultValue={settings.default_currency}
                  className="select"
                >
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </AdminField>
              <AdminField
                label="Hold duration (hours)"
                hint="0 turns holds off"
              >
                <input
                  name="hold_duration_hours"
                  type="number"
                  min={0}
                  max={168}
                  className="input"
                  defaultValue={settings.hold_duration_hours}
                />
              </AdminField>
            </div>

            <p className="rounded-lg bg-sand-deep/70 px-4 py-3 text-xs leading-relaxed text-ink-muted">
              A website booking request holds the dates for this long. If you have not
              confirmed by then, the hold expires automatically and the nights go back on
              sale.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <AdminField label="Check-in from">
                <input
                  name="check_in_time"
                  type="time"
                  className="input"
                  defaultValue={settings.check_in_time ?? "14:00"}
                />
              </AdminField>
              <AdminField label="Check-out by">
                <input
                  name="check_out_time"
                  type="time"
                  className="input"
                  defaultValue={settings.check_out_time ?? "10:00"}
                />
              </AdminField>
              <AdminField label="Default deposit %">
                <input
                  name="default_deposit_percent"
                  type="number"
                  min={0}
                  max={100}
                  className="input"
                  defaultValue={settings.default_deposit_percent}
                />
              </AdminField>
            </div>

            <AdminField label="Booking terms" hint="shown on accommodation pages">
              <textarea
                name="booking_terms"
                rows={3}
                className="textarea"
                defaultValue={settings.booking_terms ?? ""}
              />
            </AdminField>

            <AdminField label="Cancellation policy">
              <textarea
                name="cancellation_policy"
                rows={3}
                className="textarea"
                defaultValue={settings.cancellation_policy ?? ""}
              />
            </AdminField>
          </FormSection>

          {/* Pricing --------------------------------------------------- */}
          <FormSection title="Pricing">
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-sand-deep/60 px-4 py-3.5 text-sm">
              <input
                type="checkbox"
                name="hide_prices"
                defaultChecked={settings.hide_prices}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#2c6e6b]"
              />
              <span>
                Hide all prices on the website
                <span className="block text-xs text-ink-muted">
                  Every rate becomes &ldquo;Price on enquiry&rdquo;. Booking and enquiry
                  forms keep working, and your own figures are unaffected.
                </span>
              </span>
            </label>

            <AdminField
              label="USD → KES rate"
              hint="for converting quotes by hand"
            >
              <input
                name="usd_to_kes_rate"
                type="number"
                min={0}
                step="0.01"
                className="input"
                defaultValue={settings.usd_to_kes_rate}
              />
            </AdminField>
          </FormSection>

          {/* Notifications --------------------------------------------- */}
          <FormSection
            title="Notifications"
            description="Where new bookings and enquiries are sent."
          >
            <AdminField
              label="Owner email"
              hint="falls back to the public email if blank"
            >
              <input
                name="owner_email"
                type="email"
                className="input"
                defaultValue={settings.owner_email ?? ""}
              />
            </AdminField>

            <div className="space-y-2.5">
              <Toggle
                name="notify_on_booking"
                label="New accommodation bookings"
                defaultChecked={settings.notify_on_booking}
              />
              <Toggle
                name="notify_on_enquiry"
                label="New safari enquiries"
                defaultChecked={settings.notify_on_enquiry}
              />
              <Toggle
                name="notify_on_transfer"
                label="New transfer requests"
                defaultChecked={settings.notify_on_transfer}
              />
              <Toggle
                name="notify_on_message"
                label="New contact messages"
                defaultChecked={settings.notify_on_message}
              />
            </div>
          </FormSection>

          {/* Automated messages ---------------------------------------- */}
          <FormSection
            title="Automated guest messages"
            description="Sent by the daily job, once each per booking."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Pre-arrival email" hint="days before check-in">
                <input
                  name="pre_arrival_days"
                  type="number"
                  min={0}
                  max={30}
                  className="input"
                  defaultValue={settings.pre_arrival_days}
                />
              </AdminField>
              <AdminField label="Post-stay email" hint="days after check-out">
                <input
                  name="post_stay_days"
                  type="number"
                  min={0}
                  max={30}
                  className="input"
                  defaultValue={settings.post_stay_days}
                />
              </AdminField>
            </div>

            <AdminField
              label="Arrival information"
              hint="directions and check-in details for the pre-arrival email"
            >
              <textarea
                name="arrival_information"
                rows={5}
                className="textarea"
                defaultValue={settings.arrival_information ?? ""}
              />
            </AdminField>

            <AdminField label="Review link" hint="used in the post-stay email">
              <input
                name="review_url"
                type="url"
                className="input"
                defaultValue={settings.review_url ?? ""}
                placeholder="https://www.tripadvisor.com/…"
              />
            </AdminField>
          </FormSection>
        </div>
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <div className="panel flex items-center gap-4 px-5 py-3 shadow-[var(--shadow-lift)]">
          <p className="text-xs text-ink-muted">Changes apply across the whole site.</p>
          <SubmitButton>Save settings</SubmitButton>
        </div>
      </div>
    </form>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 shrink-0 accent-[#2c6e6b]"
      />
      {label}
    </label>
  );
}

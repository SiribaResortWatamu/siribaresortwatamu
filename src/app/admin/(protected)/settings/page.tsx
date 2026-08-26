import { PageHeader, Panel } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { CopyField } from "@/components/admin/copy-field";
import { getSettings } from "@/lib/data/settings";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/env";
import { formatDateTime } from "@/lib/format";
import type { Apartment } from "@/lib/types";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [settings, { data: apartmentRows }] = await Promise.all([
    getSettings(),
    supabaseAdmin()
      .from("apartments")
      .select("id, name, slug, ical_export_token, airbnb_ical_url, booking_com_ical_url, last_synced_at, status")
      .neq("status", "archived")
      .order("display_order"),
  ]);

  if (!settings) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" />
        <Panel>
          <p className="text-sm text-ink-muted">
            Settings could not be loaded. Check that the database migrations have run —
            the <code className="text-ink">site_settings</code> table should hold exactly
            one row.
          </p>
        </Panel>
      </div>
    );
  }

  const apartments = (apartmentRows as Apartment[]) ?? [];
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Property details, booking rules, pricing and notifications."
      />

      <SettingsForm settings={settings} />

      {/* Integrations ---------------------------------------------------- */}
      <Panel
        title="Integrations"
        description="Calendar feeds and email delivery."
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-medium tracking-[0.08em] text-ink-muted uppercase">
              Email
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {emailConfigured ? (
                <>
                  Resend is configured. Confirmations, receipts and guest messages are
                  being delivered.
                </>
              ) : (
                <>
                  No <code className="text-ink">RESEND_API_KEY</code> is set on this
                  deployment, so emails are written to the server log instead of being
                  sent. Everything else works normally — add the key when you are ready.
                </>
              )}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-medium tracking-[0.08em] text-ink-muted uppercase">
              Calendar feeds
            </h3>
            <p className="mt-2 mb-4 text-sm leading-relaxed text-ink-muted">
              Give each of these URLs to Airbnb and Booking.com so they block the nights
              you have sold directly. Paste their feeds into the matching accommodation to
              import theirs. Synchronisation runs every two hours.
            </p>

            {apartments.length === 0 ? (
              <p className="text-sm text-ink-muted">
                No accommodation yet — add a room and its feed appears here.
              </p>
            ) : (
              <div className="space-y-5">
                {apartments.map((apartment) => (
                  <div key={apartment.id}>
                    <CopyField
                      label={apartment.name}
                      hint={
                        apartment.last_synced_at
                          ? `last synced ${formatDateTime(apartment.last_synced_at)}`
                          : "not synced yet"
                      }
                      value={`${siteUrl()}/api/ical/${apartment.ical_export_token}`}
                    />
                    <p className="mt-1 text-xs text-ink-muted">
                      Importing from:{" "}
                      {[
                        apartment.airbnb_ical_url && "Airbnb",
                        apartment.booking_com_ical_url && "Booking.com",
                      ]
                        .filter(Boolean)
                        .join(", ") || "nothing yet"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}

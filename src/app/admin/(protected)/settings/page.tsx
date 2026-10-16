import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/data/settings";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getSettings();

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
        description="Email delivery, and where calendar sync is managed."
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
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Airbnb and Booking.com calendar sync is set up on each accommodation, under
              Channel calendars: its outgoing feed to give the channels, the feeds to import,
              and when it last synced.{" "}
              <Link href="/admin/accommodation" className="text-ocean underline">
                Go to Accommodation
              </Link>
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

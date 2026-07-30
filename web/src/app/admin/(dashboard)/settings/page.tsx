import { getSiteSettings } from "@/lib/site-settings";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <header className="mb-8 border-b border-hairline pb-4">
        <h2 className="font-display text-2xl text-ink">Global Settings</h2>
      </header>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <SiteSettingsForm initialShowPrices={settings.show_prices} initialRate={settings.usd_to_kes_rate} />
      </div>
    </div>
  );
}

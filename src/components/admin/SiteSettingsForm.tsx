"use client";

import { useState } from "react";
import { updateSiteSettings } from "@/lib/actions/site-settings";

export default function SiteSettingsForm({
  initialShowPrices,
  initialRate,
}: {
  initialShowPrices: boolean;
  initialRate: number;
}) {
  const [showPrices, setShowPrices] = useState(initialShowPrices);
  const [rate, setRate] = useState(initialRate);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    const result = await updateSiteSettings({ show_prices: showPrices, usd_to_kes_rate: rate });

    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-8">
      <label className="flex items-center gap-3 text-sm font-medium text-ink">
        <input
          type="checkbox"
          checked={showPrices}
          onChange={(e) => setShowPrices(e.target.checked)}
          className="h-5 w-5"
        />
        Show prices on the website
      </label>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Exchange Rate (1 USD = X KES)</label>
        <input
          type="number"
          step="any"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          className="w-40 rounded-lg border border-hairline px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-terracotta px-6 py-2.5 font-medium text-white transition-colors hover:bg-terracotta-hover disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>

      {saved && <span className="text-sm font-medium text-green-700">Settings saved!</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  );
}

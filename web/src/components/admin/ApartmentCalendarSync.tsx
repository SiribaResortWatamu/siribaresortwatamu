"use client";

import { useState } from "react";
import { FaPlus, FaTrash, FaArrowsRotate, FaCopy, FaCheck } from "react-icons/fa6";
import { updateExternalCalendars, syncApartmentCalendarsAction } from "@/lib/actions/ical";
import type { ExternalCalendarLink } from "@/lib/supabase/types";

export default function ApartmentCalendarSync({
  apartmentId,
  slug,
  initialCalendars,
  siteUrl,
}: {
  apartmentId: string;
  slug: string;
  initialCalendars: ExternalCalendarLink[];
  siteUrl: string;
}) {
  const [calendars, setCalendars] = useState<ExternalCalendarLink[]>(initialCalendars);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const exportUrl = `${siteUrl}/api/ical/${slug}`;

  function updateRow(i: number, patch: Partial<ExternalCalendarLink>) {
    setCalendars((c) => c.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setCalendars((c) => [...c, { label: "", url: "" }]);
  }

  function removeRow(i: number) {
    setCalendars((c) => c.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setMessage("");
    const result = await updateExternalCalendars(apartmentId, calendars);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Saved.");
  }

  async function handleSyncNow() {
    setSyncing(true);
    setError("");
    setMessage("");
    const result = await syncApartmentCalendarsAction(apartmentId);
    setSyncing(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const failed = result.results.filter((r) => r.error);
    if (failed.length > 0) {
      setError(failed.map((f) => `${f.source}: ${f.error}`).join("; "));
    } else {
      setMessage(
        result.results.length === 0
          ? "No external calendars configured."
          : `Synced ${result.results.reduce((n, r) => n + r.eventCount, 0)} date range(s).`
      );
    }
  }

  function copyExportUrl() {
    navigator.clipboard.writeText(exportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-8 border-t border-hairline pt-6">
      <h3 className="mb-1 font-display text-lg text-ink">iCal Sync</h3>
      <p className="mb-4 text-xs text-ink-muted">
        Export this apartment&apos;s bookings so Airbnb/Booking.com can block matching dates, and
        import their calendars so guests booking here see those dates blocked too. Syncing isn&apos;t
        instant — external platforms typically only re-check imported calendars every few hours.
      </p>

      <div className="mb-6">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
          Export URL (paste into Airbnb/Booking.com &quot;import calendar&quot;)
        </label>
        <div className="flex gap-2">
          <input
            readOnly
            value={exportUrl}
            className="flex-1 rounded-lg border border-hairline bg-sand/50 px-3 py-2 text-sm text-ink-muted"
          />
          <button
            type="button"
            onClick={copyExportUrl}
            className="flex items-center gap-1.5 rounded-lg border border-hairline px-3 text-sm text-ink-muted hover:bg-sand"
          >
            {copied ? <FaCheck className="text-green-600" /> : <FaCopy />}
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Import from (their calendar export URLs)
        </label>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 rounded-full border border-terracotta px-3 py-1 text-xs font-medium text-terracotta hover:bg-terracotta hover:text-white"
        >
          <FaPlus /> Add Calendar
        </button>
      </div>

      <div className="space-y-2">
        {calendars.length === 0 && (
          <p className="text-sm text-ink-muted">No external calendars linked yet.</p>
        )}
        {calendars.map((cal, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              placeholder="Airbnb"
              value={cal.label}
              onChange={(e) => updateRow(i, { label: e.target.value })}
              className="w-28 rounded-lg border border-hairline px-3 py-2 text-sm"
            />
            <input
              type="url"
              placeholder="https://www.airbnb.com/calendar/ical/...ics"
              value={cal.url}
              onChange={(e) => updateRow(i, { url: e.target.value })}
              className="flex-1 rounded-lg border border-hairline px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              aria-label="Remove calendar"
              className="rounded-lg border border-hairline px-3 text-red-600 hover:bg-red-50"
            >
              <FaTrash />
            </button>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {message && !error && <p className="mt-3 text-sm text-green-700">{message}</p>}

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-terracotta px-5 py-2 text-sm font-medium text-white hover:bg-terracotta-hover disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Calendars"}
        </button>
        <button
          type="button"
          onClick={handleSyncNow}
          disabled={syncing}
          className="flex items-center gap-2 rounded-full border border-hairline px-5 py-2 text-sm font-medium text-ink-muted hover:bg-sand disabled:opacity-60"
        >
          <FaArrowsRotate className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing…" : "Sync Now"}
        </button>
      </div>
    </div>
  );
}

"use client";

/* eslint-disable @next/next/no-img-element -- the preview shows a freshly
   uploaded object URL, which next/image cannot resolve. */

import { useRef, useState } from "react";
import { ImagePlus, Loader2, RotateCcw, TriangleAlert } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AdminField } from "@/components/admin/form";
import { resolveImage } from "@/lib/images";
import { cn } from "@/lib/utils";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/svg+xml", "image/webp"];

/**
 * Single-image upload for a logo variant.
 *
 * Leaving it empty is a valid answer — the site falls back to the brand
 * files bundled in /public — so "Reset to default" clears the override
 * rather than deleting anything.
 */
export function LogoUpload({
  name,
  label,
  hint,
  defaultValue,
  fallback,
  preview,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue: string | null;
  /** Shown when no override is set. */
  fallback: string;
  /** "light" renders the preview on ink so a white logo is visible. */
  preview: "light" | "dark";
}) {
  const [path, setPath] = useState<string | null>(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const src = resolveImage(path) ?? fallback;

  async function upload(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Use a PNG, SVG or WebP file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That file is over 2 MB. A logo should be far smaller.");
      return;
    }

    setBusy(true);
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const key = `branding/${name}-${Date.now()}.${extension}`;

    const { error: uploadError } = await createSupabaseBrowserClient()
      .storage.from("media")
      .upload(key, file, { cacheControl: "31536000", upsert: false });

    setBusy(false);

    if (uploadError) {
      setError(uploadError.message);
      return;
    }
    setPath(key);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <AdminField label={label} hint={hint}>
      <input type="hidden" name={name} value={path ?? ""} />

      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-line p-5",
          preview === "light" ? "bg-ink" : "bg-sand",
        )}
      >
        <img src={src} alt="" className="h-10 w-auto object-contain" />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(event) => upload(event.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn btn-outline btn-sm"
        >
          {busy ? (
            <>
              <Loader2 size={14} className="animate-spin" strokeWidth={2} />
              Uploading…
            </>
          ) : (
            <>
              <ImagePlus size={14} strokeWidth={1.6} />
              {path ? "Replace" : "Upload"}
            </>
          )}
        </button>

        {path && (
          <button
            type="button"
            onClick={() => setPath(null)}
            className="btn btn-outline btn-sm"
          >
            <RotateCcw size={13} strokeWidth={1.75} />
            Reset to default
          </button>
        )}

        <span className="text-xs text-ink-muted">
          {path ? "Custom logo" : "Using the built-in logo"}
        </span>
      </div>

      {error && (
        <p className="mt-2 flex items-start gap-2 rounded-lg bg-[#fbe1dc] px-3 py-2 text-xs text-[#a3402c]">
          <TriangleAlert size={14} strokeWidth={1.6} className="mt-px shrink-0" />
          {error}
        </p>
      )}
    </AdminField>
  );
}

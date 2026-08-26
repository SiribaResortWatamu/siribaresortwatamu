"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { AdminField } from "@/components/admin/form";

/** Read-only value with a copy button — for calendar feed URLs and the like. */
export function CopyField({
  label,
  hint,
  value,
}: {
  label: string;
  hint?: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the value is selectable either way.
    }
  }

  return (
    <AdminField label={label} hint={hint}>
      <div className="flex gap-2">
        <input readOnly value={value} className="input bg-sand/60 text-xs" />
        <button
          type="button"
          onClick={copy}
          className="btn btn-outline btn-sm shrink-0"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <>
              <Check size={14} strokeWidth={2} />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} strokeWidth={1.75} />
              Copy
            </>
          )}
        </button>
      </div>
    </AdminField>
  );
}

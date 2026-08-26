"use client";

import { useActionState, useState } from "react";
import { StickyNote } from "lucide-react";
import { saveMessageNote } from "@/app/actions/admin/operations";
import { IDLE } from "@/lib/action-state";
import { FormFeedback, SubmitButton } from "@/components/admin/form";
import type { ContactMessage } from "@/lib/types";

/** Collapsible internal note against one message. */
export function MessageNote({ message }: { message: ContactMessage }) {
  const [state, formAction] = useActionState(saveMessageNote, IDLE);
  const [open, setOpen] = useState(Boolean(message.admin_note));

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-ocean transition-colors hover:text-ocean-dark"
      >
        <StickyNote size={13} strokeWidth={1.75} />
        Add a note
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-4 space-y-2.5 border-t border-line pt-4">
      <input type="hidden" name="id" value={message.id} />
      <FormFeedback state={state} />

      <label className="field-label">
        Internal note
        <span className="ml-1.5 font-normal text-ink-muted">(not sent to anyone)</span>
      </label>
      <textarea
        name="note"
        rows={3}
        className="textarea"
        defaultValue={message.admin_note ?? ""}
        placeholder="What you told them, what to follow up…"
      />
      <div className="flex gap-2">
        <SubmitButton>Save note</SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-outline btn-sm"
        >
          Close
        </button>
      </div>
    </form>
  );
}

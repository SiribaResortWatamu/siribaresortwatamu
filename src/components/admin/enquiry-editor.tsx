"use client";

import { useActionState } from "react";
import { updateSafariEnquiry } from "@/app/actions/admin/operations";
import { IDLE } from "@/lib/action-state";
import {
  AdminField,
  FormFeedback,
  FormSection,
  SubmitButton,
} from "@/components/admin/form";
import type { SafariEnquiry } from "@/lib/types";

export function EnquiryEditor({ enquiry }: { enquiry: SafariEnquiry }) {
  const [state, formAction] = useActionState(updateSafariEnquiry, IDLE);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={enquiry.id} />
      <FormFeedback state={state} />

      <FormSection title="Progress" description="Where this enquiry has got to.">
        <AdminField label="Status">
          <select name="status" defaultValue={enquiry.status} className="select">
            <option value="new">New — not looked at yet</option>
            <option value="contacted">Contacted — we have replied</option>
            <option value="quoted">Quoted — price sent</option>
            <option value="confirmed">Confirmed — they are going</option>
            <option value="completed">Completed — trip has happened</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </AdminField>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label={`Quoted amount (${enquiry.currency})`} hint="optional">
            <input
              name="quotedAmount"
              type="number"
              min={0}
              step="0.01"
              className="input"
              defaultValue={enquiry.quoted_amount ?? ""}
            />
          </AdminField>

          <AdminField label="Travel date" hint="update once agreed">
            <input
              name="travelDate"
              type="date"
              className="input"
              defaultValue={enquiry.travel_date ?? ""}
            />
          </AdminField>
        </div>

        <AdminField label="Internal notes" hint="not shown to the guest">
          <textarea
            name="notes"
            rows={6}
            className="textarea"
            defaultValue={enquiry.notes ?? ""}
            placeholder="What you quoted, what they asked for, when to follow up…"
          />
        </AdminField>

        <SubmitButton className="w-full">Save enquiry</SubmitButton>
      </FormSection>
    </form>
  );
}

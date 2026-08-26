"use client";

import { useActionState } from "react";
import { saveGuest } from "@/app/actions/admin/operations";
import { IDLE } from "@/lib/action-state";
import {
  AdminField,
  FormFeedback,
  FormSection,
  SubmitButton,
} from "@/components/admin/form";
import type { Guest } from "@/lib/types";

export function GuestEditor({ guest }: { guest: Guest }) {
  const [state, formAction] = useActionState(saveGuest, IDLE);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={guest.id} />
      <FormFeedback state={state} />

      <FormSection
        title="Guest details"
        description="The email address identifies the guest across bookings and cannot be changed here."
      >
        <AdminField label="Name">
          <input name="name" className="input" defaultValue={guest.name} required />
        </AdminField>

        <AdminField label="Email">
          <input value={guest.email} readOnly className="input bg-sand/60" />
        </AdminField>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Phone">
            <input
              name="phone"
              type="tel"
              className="input"
              defaultValue={guest.phone ?? ""}
            />
          </AdminField>
          <AdminField label="WhatsApp">
            <input
              name="whatsapp"
              type="tel"
              className="input"
              defaultValue={guest.whatsapp ?? ""}
            />
          </AdminField>
        </div>

        <AdminField label="Country">
          <input name="country" className="input" defaultValue={guest.country ?? ""} />
        </AdminField>

        <AdminField label="Notes" hint="preferences, allergies, anything worth remembering">
          <textarea
            name="notes"
            rows={6}
            className="textarea"
            defaultValue={guest.notes ?? ""}
          />
        </AdminField>

        <SubmitButton className="w-full">Save guest</SubmitButton>
      </FormSection>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { emailDocument } from "@/app/actions/admin/documents";
import { IDLE } from "@/lib/action-state";
import { AdminField, FormFeedback, SubmitButton } from "@/components/admin/form";

export function DocumentEmailForm({ id, email }: { id: string; email: string }) {
  const [state, formAction] = useActionState(emailDocument, IDLE);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <FormFeedback state={state} />
      <AdminField label="Send to">
        <input name="to" type="email" className="input" defaultValue={email} required />
      </AdminField>
      <SubmitButton variant="outline">Email the client a link</SubmitButton>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { createSafariEnquiry } from "@/app/actions/public";
import { IDLE } from "@/lib/action-state";
import {
  ContactFields,
  Field,
  FormNotice,
  SuccessPanel,
} from "@/components/site/form-parts";
import { toDateKey } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import type { SafariPackage } from "@/lib/types";

export function SafariEnquiryForm({
  safari,
  whatsapp,
}: {
  safari: SafariPackage;
  whatsapp: string | null;
}) {
  const [state, formAction, pending] = useActionState(createSafariEnquiry, IDLE);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  const wa = whatsappLink(
    whatsapp,
    `Hello! I'd like to enquire about the ${safari.name} safari.`,
  );

  if (state.status === "success") {
    return (
      <SuccessPanel
        title={state.message}
        reference={state.reference}
        detail={state.detail}
        whatsappHref={wa}
      />
    );
  }

  return (
    <form action={formAction} className="card p-7 sm:p-8">
      <input type="hidden" name="safariId" value={safari.id} />

      <h3 className="font-display text-xl font-semibold">Enquire about this safari</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Tell us roughly when you would like to travel and how many of you there are.
        We will come back with availability and a full quote.
      </p>

      <div className="mt-7 space-y-4">
        <ContactFields errors={errors} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preferred travel date" hint="optional" error={errors.travelDate}>
            <input
              name="travelDate"
              type="date"
              className="input"
              min={toDateKey(new Date())}
            />
          </Field>

          <Field label="Number of travellers">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  name="adults"
                  type="number"
                  min={1}
                  max={50}
                  defaultValue={2}
                  className="input"
                  aria-label="Adults"
                  required
                />
                <p className="mt-1 text-center text-[0.7rem] text-ink-muted">Adults</p>
              </div>
              <div>
                <input
                  name="children"
                  type="number"
                  min={0}
                  max={50}
                  defaultValue={0}
                  className="input"
                  aria-label="Children"
                />
                <p className="mt-1 text-center text-[0.7rem] text-ink-muted">Children</p>
              </div>
            </div>
            {errors.adults && <p className="field-error">{errors.adults}</p>}
          </Field>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-sand-deep/60 px-4 py-3.5">
          <input
            type="checkbox"
            name="dateFlexible"
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#2c6e6b]"
          />
          <span className="text-sm leading-relaxed">
            My dates are flexible
            <span className="block text-xs text-ink-muted">
              We can often suggest better rates a week either side.
            </span>
          </span>
        </label>

        <Field label="Anything we should know?" hint="optional" error={errors.specialRequests}>
          <textarea
            name="specialRequests"
            className="textarea"
            rows={4}
            placeholder="Dietary requirements, mobility needs, room configuration, a birthday to mark…"
          />
        </Field>

        {state.status === "error" && <FormNotice>{state.message}</FormNotice>}

        <div className="flex flex-col gap-3 pt-1 sm:flex-row">
          <button type="submit" disabled={pending} className="btn btn-primary flex-1">
            {pending ? (
              <>
                <Loader2 size={16} className="animate-spin" strokeWidth={2} />
                Sending…
              </>
            ) : (
              <>
                <Send size={15} strokeWidth={1.75} />
                Send Safari Enquiry
              </>
            )}
          </button>

          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              <WhatsAppIcon size={16} className="text-[#1faa54]" />
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </form>
  );
}

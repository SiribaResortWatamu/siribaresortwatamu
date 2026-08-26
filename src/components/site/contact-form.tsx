"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { sendContactMessage } from "@/app/actions/public";
import { IDLE } from "@/lib/action-state";
import {
  ContactFields,
  Field,
  FormNotice,
  SuccessPanel,
} from "@/components/site/form-parts";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, IDLE);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  if (state.status === "success") {
    return <SuccessPanel title={state.message} detail={state.detail} />;
  }

  return (
    <form action={formAction} className="card p-7 sm:p-9">
      <h2 className="font-display text-xl font-semibold">Send us a message</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Questions about availability, safaris or getting here — anything at all. We
        usually reply the same day.
      </p>

      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="mt-7 space-y-4">
        <ContactFields errors={errors} />

        <Field label="Subject" hint="optional" error={errors.subject}>
          <input name="subject" className="input" placeholder="What is this about?" />
        </Field>

        <Field label="Message" error={errors.message}>
          <textarea
            name="message"
            className="textarea"
            rows={6}
            required
            placeholder="Tell us what you need…"
          />
        </Field>

        {state.status === "error" && <FormNotice>{state.message}</FormNotice>}

        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? (
            <>
              <Loader2 size={16} className="animate-spin" strokeWidth={2} />
              Sending…
            </>
          ) : (
            <>
              <Send size={15} strokeWidth={1.75} />
              Send Message
            </>
          )}
        </button>
      </div>
    </form>
  );
}

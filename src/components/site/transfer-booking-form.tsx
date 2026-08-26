"use client";

import { useActionState, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { createTransferRequest } from "@/app/actions/public";
import { IDLE } from "@/lib/action-state";
import {
  ContactFields,
  Field,
  FormNotice,
  SuccessPanel,
} from "@/components/site/form-parts";
import { formatMoney, toDateKey } from "@/lib/format";
import { quoteTransfer, transferPriceLabel } from "@/lib/pricing";
import { whatsappLink } from "@/lib/whatsapp";
import type { TransferService } from "@/lib/types";

export function TransferBookingForm({
  service,
  hidePrices,
  whatsapp,
}: {
  service: TransferService;
  hidePrices: boolean;
  whatsapp: string | null;
}) {
  const [state, formAction, pending] = useActionState(createTransferRequest, IDLE);
  const [passengers, setPassengers] = useState(2);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  // Preview only — the server recalculates this from the stored service.
  const quote = quoteTransfer(service, { passengers });

  const wa = whatsappLink(
    whatsapp,
    `Hello! I'd like to book the ${service.name}.`,
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

  const hasFlightField = /airport/i.test(service.service_type);
  const hasTrainField = /sgr|train|rail/i.test(service.service_type);

  return (
    <form action={formAction} className="card p-7 sm:p-8">
      <input type="hidden" name="transferId" value={service.id} />

      <h3 className="font-display text-xl font-semibold">Request this transfer</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Tell us when and where. We will confirm the driver and vehicle, usually within
        a few hours.
      </p>

      <div className="mt-7 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pick-up location" error={errors.pickupLocation}>
            <input
              name="pickupLocation"
              className="input"
              required
              list={`pickup-${service.id}`}
              defaultValue={service.pickup_locations[0] ?? ""}
              placeholder="Where should we collect you?"
            />
            <datalist id={`pickup-${service.id}`}>
              {service.pickup_locations.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </Field>

          <Field label="Drop-off location" error={errors.dropoffLocation}>
            <input
              name="dropoffLocation"
              className="input"
              required
              list={`dropoff-${service.id}`}
              defaultValue={service.dropoff_locations[0] ?? ""}
              placeholder="Where are you going?"
            />
            <datalist id={`dropoff-${service.id}`}>
              {service.dropoff_locations.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" error={errors.transferDate}>
            <input
              name="transferDate"
              type="date"
              className="input"
              required
              min={toDateKey(new Date())}
            />
          </Field>
          <Field label="Pick-up time" hint="optional" error={errors.pickupTime}>
            <input name="pickupTime" type="time" className="input" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Passengers" error={errors.passengers}>
            <select
              name="passengers"
              className="select"
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
            >
              {Array.from({ length: service.passenger_capacity }, (_, i) => i + 1).map(
                (n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "passenger" : "passengers"}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field label="Luggage items" error={errors.luggage}>
            <input
              name="luggage"
              type="number"
              min={0}
              max={60}
              defaultValue={2}
              className="input"
            />
          </Field>
        </div>

        {(hasFlightField || hasTrainField) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {hasFlightField && (
              <Field label="Flight number" hint="optional" error={errors.flightNumber}>
                <input name="flightNumber" className="input" placeholder="e.g. KQ 610" />
              </Field>
            )}
            {hasTrainField && (
              <Field label="Train number" hint="optional" error={errors.trainNumber}>
                <input name="trainNumber" className="input" placeholder="e.g. Madaraka 01" />
              </Field>
            )}
          </div>
        )}

        <ContactFields errors={errors} nameLabel="Passenger name" />

        <Field
          label="Special instructions"
          hint="optional"
          error={errors.specialInstructions}
        >
          <textarea
            name="specialInstructions"
            className="textarea"
            rows={3}
            placeholder="Child seat, extra stop, meeting point…"
          />
        </Field>

        {/* Price preview -------------------------------------------- */}
        {!hidePrices && (
          <div className="rounded-xl bg-sand-deep/70 px-4 py-4">
            {quote.onEnquiry ? (
              <p className="text-sm text-ink-muted">
                This service is quoted per journey. Send us the details and we will come
                back with a price.
              </p>
            ) : (
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-sm text-ink-muted">Estimated total</p>
                  {quote.quantity > 1 && (
                    <p className="text-xs text-ink-muted">
                      {formatMoney(quote.unitPrice, quote.currency)}{" "}
                      {transferPriceLabel(quote.method)} × {quote.quantity}
                    </p>
                  )}
                </div>
                <p className="font-display text-xl font-semibold">
                  {formatMoney(quote.total, quote.currency)}
                </p>
              </div>
            )}
          </div>
        )}

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
                Request Transfer
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
              Book via WhatsApp
            </a>
          )}
        </div>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveDocument } from "@/app/actions/admin/documents";
import { IDLE } from "@/lib/action-state";
import {
  AdminField,
  FormFeedback,
  FormSection,
  SubmitButton,
} from "@/components/admin/form";
import { DOCUMENT_LABELS, computeTotals, lineTotal } from "@/lib/documents";
import { formatMoney } from "@/lib/format";
import type { DocumentLine, DocumentType } from "@/lib/types";

export interface EditorValues {
  id?: string;
  docType: DocumentType;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  currency: string;
  issueDate: string;
  dueDate: string;
  paymentMethod: string;
  paymentReference: string;
  paymentDate: string;
  discount: number;
  notes: string;
  terms: string;
  lines: DocumentLine[];
  /** Carried through unchanged so the new document stays linked to its source. */
  links: {
    bookingId?: string;
    transferBookingId?: string;
    safariEnquiryId?: string;
    guestId?: string;
    parentId?: string;
  };
}

const PAYMENT_METHODS = ["M-Pesa", "M-Pesa Paybill", "Bank transfer", "Cash", "Card", "Airbnb / Booking.com", "Other"];

const BLANK_LINE: DocumentLine = { description: "", quantity: 1, unit_price: 0 };

const CURRENCIES: [string, string][] = [
  ["KES", "Kenyan shilling"],
  ["USD", "US dollar"],
  ["EUR", "Euro"],
  ["GBP", "British pound"],
];

export function DocumentEditor({ values }: { values: EditorValues }) {
  const [state, formAction] = useActionState(saveDocument, IDLE);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const label = DOCUMENT_LABELS[values.docType];
  const isReceipt = values.docType === "receipt";

  const [lines, setLines] = useState<DocumentLine[]>(
    values.lines.length ? values.lines : [{ ...BLANK_LINE }],
  );
  const [discount, setDiscount] = useState(values.discount);
  const [currency, setCurrency] = useState(values.currency);

  // A document raised from a booking may already carry another currency;
  // keep it selectable rather than silently switching it.
  const currencyOptions = CURRENCIES.some(([code]) => code === values.currency)
    ? CURRENCIES
    : [...CURRENCIES, [values.currency, "Current currency"] as [string, string]];

  const totals = computeTotals(
    lines.filter((l) => l.description.trim() && l.quantity > 0),
    discount,
  );

  const update = (index: number, patch: Partial<DocumentLine>) =>
    setLines((current) => current.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  return (
    <form action={formAction} className="@container space-y-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="docType" value={values.docType} />
      <input type="hidden" name="bookingId" value={values.links.bookingId ?? ""} />
      <input type="hidden" name="transferBookingId" value={values.links.transferBookingId ?? ""} />
      <input type="hidden" name="safariEnquiryId" value={values.links.safariEnquiryId ?? ""} />
      <input type="hidden" name="guestId" value={values.links.guestId ?? ""} />
      <input type="hidden" name="parentId" value={values.links.parentId ?? ""} />
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />

      <FormFeedback state={state} />

      <FormSection title="Client">
        <div className="grid gap-4 @lg:grid-cols-2">
          <AdminField label="Name" required error={errors.clientName}>
            <input
              name="clientName"
              className="input"
              required
              defaultValue={values.clientName}
            />
          </AdminField>
          <AdminField label="Email" error={errors.clientEmail}>
            <input
              name="clientEmail"
              type="email"
              className="input"
              defaultValue={values.clientEmail}
            />
          </AdminField>
          <AdminField label="Phone / WhatsApp">
            <input name="clientPhone" className="input" defaultValue={values.clientPhone} />
          </AdminField>
          <AdminField label="Address" hint="optional">
            <input
              name="clientAddress"
              className="input"
              defaultValue={values.clientAddress}
            />
          </AdminField>
        </div>
      </FormSection>

      <FormSection title={`${label.singular} details`}>
        <div className="grid gap-4 @xl:grid-cols-3">
          <AdminField label="Currency" required error={errors.currency}>
            <select
              name="currency"
              className="select"
              required
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {currencyOptions.map(([code, name]) => (
                <option key={code} value={code}>
                  {code} — {name}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Date" error={errors.issueDate}>
            <input
              name="issueDate"
              type="date"
              className="input"
              defaultValue={values.issueDate}
            />
            <p className="mt-1 text-xs text-ink-muted">Defaults to the day it is issued.</p>
          </AdminField>
          {!isReceipt && (
            <AdminField
              label={values.docType === "quotation" ? "Valid until" : "Payment due"}
              error={errors.dueDate}
            >
              <input
                name="dueDate"
                type="date"
                className="input"
                defaultValue={values.dueDate}
              />
            </AdminField>
          )}
        </div>

        {isReceipt && (
          <div className="grid gap-4 @xl:grid-cols-3">
            <AdminField label="Payment method">
              <select
                name="paymentMethod"
                className="select"
                defaultValue={values.paymentMethod}
              >
                <option value="">—</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Reference" hint="M-Pesa code, cheque no.">
              <input
                name="paymentReference"
                className="input"
                defaultValue={values.paymentReference}
              />
            </AdminField>
            <AdminField label="Payment date" error={errors.paymentDate}>
              <input
                name="paymentDate"
                type="date"
                className="input"
                defaultValue={values.paymentDate}
              />
            </AdminField>
          </div>
        )}
      </FormSection>

      <FormSection
        title={isReceipt ? "What was paid" : "Line items"}
        description={
          isReceipt
            ? "The total here is the amount received."
            : "Quantity × unit price. Use a negative price for a discount line."
        }
      >
        <div className="space-y-3">
          <div className="hidden grid-cols-[1fr_5rem_8rem_7rem_2rem] gap-2 text-[0.7rem] tracking-[0.08em] text-ink-muted uppercase @xl:grid">
            <span>Description</span>
            <span>Qty</span>
            <span>Unit price</span>
            <span className="text-right">Amount</span>
            <span />
          </div>

          {lines.map((line, index) => (
            <div
              key={index}
              className="grid grid-cols-2 gap-2 rounded-xl border border-line p-3 @xl:grid-cols-[1fr_5rem_8rem_7rem_2rem] @xl:items-center @xl:border-0 @xl:p-0"
            >
              <input
                aria-label="Description"
                className="input col-span-2 @xl:col-span-1"
                placeholder="Description"
                value={line.description}
                onChange={(e) => update(index, { description: e.target.value })}
              />
              <input
                aria-label="Quantity"
                type="number"
                min={0}
                step="any"
                className="input"
                value={line.quantity}
                onChange={(e) => update(index, { quantity: Number(e.target.value) })}
              />
              <input
                aria-label="Unit price"
                type="number"
                step="any"
                className="input"
                value={line.unit_price}
                onChange={(e) => update(index, { unit_price: Number(e.target.value) })}
              />
              <span className="text-right text-sm tabular-nums">
                {formatMoney(lineTotal(line), currency)}
              </span>
              <button
                type="button"
                aria-label="Remove line"
                disabled={lines.length === 1}
                onClick={() => setLines((c) => c.filter((_, i) => i !== index))}
                className="flex h-8 w-8 items-center justify-center justify-self-end rounded-lg text-ink-muted transition-colors hover:bg-sand-deep hover:text-[#a3402c] disabled:opacity-30"
              >
                <Trash2 size={15} strokeWidth={1.6} />
              </button>
            </div>
          ))}

          {errors.lines && <p className="field-error">{errors.lines}</p>}

          <button
            type="button"
            onClick={() => setLines((c) => [...c, { ...BLANK_LINE }])}
            className="btn btn-outline btn-sm"
          >
            <Plus size={14} strokeWidth={2} />
            Add line
          </button>
        </div>

        <div className="ml-auto max-w-xs space-y-2 border-t border-line pt-4">
          {!isReceipt && (
            <>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-ink-muted">Subtotal</span>
                <span className="tabular-nums">{formatMoney(totals.subtotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <label htmlFor="discount" className="text-ink-muted">
                  Discount
                </label>
                <input
                  id="discount"
                  name="discount"
                  type="number"
                  min={0}
                  step="any"
                  className="input w-32 text-right"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>
            </>
          )}
          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-2">
            <span className="font-medium">{isReceipt ? "Amount received" : "Total"}</span>
            <span className="font-display text-lg font-semibold tabular-nums">
              {formatMoney(totals.total, currency)}
            </span>
          </div>
        </div>
      </FormSection>

      <FormSection title="Notes and terms">
        <AdminField label="Notes" hint="shown on the document">
          <textarea name="notes" rows={3} className="textarea" defaultValue={values.notes} />
        </AdminField>
        {values.docType !== "receipt" && (
          <AdminField
            label={values.docType === "invoice" ? "How to pay" : "Terms"}
            hint="bank, M-Pesa, cancellation terms…"
          >
            <textarea name="terms" rows={4} className="textarea" defaultValue={values.terms} />
          </AdminField>
        )}
      </FormSection>

      <div className="flex justify-end">
        <SubmitButton>{values.id ? "Save draft" : `Create ${label.singular.toLowerCase()}`}</SubmitButton>
      </div>
    </form>
  );
}

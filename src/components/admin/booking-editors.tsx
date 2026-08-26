"use client";

import { useActionState } from "react";
import { recordPayment, updateBooking } from "@/app/actions/admin/bookings";
import { IDLE } from "@/lib/action-state";
import {
  AdminField,
  FormFeedback,
  FormSection,
  SubmitButton,
} from "@/components/admin/form";
import { formatMoney, toDateKey } from "@/lib/format";
import type { Booking } from "@/lib/types";

export function BookingEditor({ booking }: { booking: Booking }) {
  const [state, formAction] = useActionState(updateBooking, IDLE);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={booking.id} />
      <FormFeedback state={state} />

      <FormSection
        title="Edit booking"
        description="Moving the dates re-prices the stay unless you set a total."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Check-in" error={errors.checkIn}>
            <input
              name="checkIn"
              type="date"
              className="input"
              defaultValue={booking.check_in}
            />
          </AdminField>
          <AdminField label="Check-out" error={errors.checkOut}>
            <input
              name="checkOut"
              type="date"
              className="input"
              defaultValue={booking.check_out}
            />
          </AdminField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Guests">
            <input
              name="guests"
              type="number"
              min={1}
              className="input"
              defaultValue={booking.guests_count}
            />
          </AdminField>
          <AdminField label="Guest phone">
            <input
              name="phone"
              type="tel"
              className="input"
              defaultValue={booking.guest_phone_snapshot ?? ""}
            />
          </AdminField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField
            label={`Total (${booking.currency})`}
            hint="blank recalculates from the rate"
          >
            <input
              name="total"
              type="number"
              min={0}
              step="0.01"
              className="input"
              defaultValue={booking.total_snapshot}
            />
          </AdminField>
          <AdminField label={`Deposit required (${booking.currency})`}>
            <input
              name="deposit"
              type="number"
              min={0}
              step="0.01"
              className="input"
              defaultValue={booking.deposit_required}
            />
          </AdminField>
        </div>

        <AdminField label="Special requests">
          <textarea
            name="specialRequests"
            rows={3}
            className="textarea"
            defaultValue={booking.special_requests ?? ""}
          />
        </AdminField>

        <AdminField label="Internal notes" hint="not shown to the guest">
          <textarea
            name="notes"
            rows={4}
            className="textarea"
            defaultValue={booking.notes ?? ""}
          />
        </AdminField>

        <SubmitButton className="w-full">Save changes</SubmitButton>
      </FormSection>
    </form>
  );
}

export function PaymentForm({ booking }: { booking: Booking }) {
  const [state, formAction] = useActionState(recordPayment, IDLE);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  const outstanding = booking.balance;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={booking.id} />
      <FormFeedback state={state} />

      <FormSection
        title="Record a payment"
        description={
          outstanding > 0
            ? `${formatMoney(outstanding, booking.currency)} outstanding.`
            : "This booking is settled in full."
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label={`Amount received (${booking.currency})`} error={errors.amount}>
            <input
              name="amount"
              type="number"
              min={0}
              step="0.01"
              className="input"
              placeholder={outstanding > 0 ? String(outstanding) : "0"}
              required
            />
          </AdminField>
          <AdminField label="Date received">
            <input
              name="date"
              type="date"
              className="input"
              defaultValue={toDateKey(new Date())}
            />
          </AdminField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Method">
            <input
              name="method"
              className="input"
              list="payment-methods"
              defaultValue={booking.payment_method ?? ""}
              placeholder="M-Pesa"
            />
            <datalist id="payment-methods">
              <option value="M-Pesa" />
              <option value="Bank transfer" />
              <option value="Cash" />
              <option value="Card" />
              <option value="Airbnb payout" />
              <option value="Booking.com payout" />
            </datalist>
          </AdminField>
          <AdminField label="Reference">
            <input
              name="reference"
              className="input"
              defaultValue={booking.payment_reference ?? ""}
              placeholder="Transaction code"
            />
          </AdminField>
        </div>

        <AdminField label="Payment notes">
          <textarea
            name="notes"
            rows={2}
            className="textarea"
            defaultValue={booking.payment_notes ?? ""}
          />
        </AdminField>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-sand-deep/60 px-4 py-3 text-sm">
          <input
            type="checkbox"
            name="sendReceipt"
            defaultChecked
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#2c6e6b]"
          />
          <span>
            Email a receipt to the guest
            <span className="block text-xs text-ink-muted">
              Confirms the amount received and the balance remaining.
            </span>
          </span>
        </label>

        <SubmitButton className="w-full">Record payment</SubmitButton>
      </FormSection>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { updateTransferRequest } from "@/app/actions/admin/operations";
import { IDLE } from "@/lib/action-state";
import {
  AdminField,
  FormFeedback,
  FormSection,
  SubmitButton,
} from "@/components/admin/form";
import { formatMoney } from "@/lib/format";
import type { Driver, TransferBooking, Vehicle } from "@/lib/types";

export function TransferRequestEditor({
  request,
  drivers,
  vehicles,
}: {
  request: TransferBooking;
  drivers: Driver[];
  vehicles: Vehicle[];
}) {
  const [state, formAction] = useActionState(updateTransferRequest, IDLE);
  const [driverId, setDriverId] = useState(request.driver_id ?? "");

  const selectedDriver = drivers.find((d) => d.id === driverId);
  const driverHasEmail = Boolean(selectedDriver?.email);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={request.id} />
      <FormFeedback state={state} />

      <FormSection title="Dispatch" description="Who is driving, and in what.">
        <AdminField label="Driver">
          <select
            name="driverId"
            value={driverId}
            onChange={(event) => setDriverId(event.target.value)}
            className="select"
          >
            <option value="">Not assigned</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
                {driver.status === "inactive" ? " (inactive)" : ""}
              </option>
            ))}
          </select>
        </AdminField>

        <AdminField label="Vehicle">
          <select
            name="vehicleId"
            defaultValue={request.vehicle_id ?? selectedDriver?.vehicle_id ?? ""}
            className="select"
          >
            <option value="">Not assigned</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name} — {vehicle.registration} ({vehicle.capacity} pax)
              </option>
            ))}
          </select>
        </AdminField>

        <AdminField label="Pick-up time">
          <input
            name="pickupTime"
            type="time"
            className="input"
            defaultValue={request.pickup_time?.slice(0, 5) ?? ""}
          />
        </AdminField>

        <AdminField label="Status">
          <select
            name="status"
            defaultValue={request.booking_status}
            className="select"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="driver_assigned">Driver assigned</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </AdminField>

        {driverId && (
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-sand-deep/60 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="notifyDriver"
              defaultChecked={driverHasEmail}
              disabled={!driverHasEmail}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#2c6e6b]"
            />
            <span>
              Email the job to the driver
              {!driverHasEmail && (
                <span className="block text-xs text-ink-muted">
                  {selectedDriver?.name ?? "This driver"} has no email address on file —
                  add one under Drivers, or send the details by WhatsApp.
                </span>
              )}
            </span>
          </label>
        )}
      </FormSection>

      <FormSection title="Money" description="What the journey costs and what is paid.">
        <AdminField
          label={`Fare (${request.currency})`}
          hint={
            request.pricing_method_snapshot === "on_enquiry"
              ? "quote this journey"
              : "calculated at booking; change if you agreed something else"
          }
        >
          <input
            name="price"
            type="number"
            min={0}
            step="0.01"
            className="input"
            defaultValue={request.price_snapshot}
          />
        </AdminField>

        <AdminField label={`Amount paid (${request.currency})`}>
          <input
            name="amountPaid"
            type="number"
            min={0}
            step="0.01"
            className="input"
            defaultValue={request.amount_paid}
          />
        </AdminField>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Payment method">
            <input
              name="paymentMethod"
              className="input"
              defaultValue={request.payment_method ?? ""}
              placeholder="M-Pesa, cash, transfer"
            />
          </AdminField>
          <AdminField label="Reference">
            <input
              name="paymentReference"
              className="input"
              defaultValue={request.payment_reference ?? ""}
            />
          </AdminField>
        </div>

        <p className="text-xs text-ink-muted">
          Balance updates automatically:{" "}
          {formatMoney(request.balance, request.currency)} outstanding as things stand.
        </p>
      </FormSection>

      <FormSection title="Notes">
        <AdminField label="Internal notes" hint="not shown to the customer">
          <textarea
            name="notes"
            rows={5}
            className="textarea"
            defaultValue={request.notes ?? ""}
          />
        </AdminField>

        <SubmitButton className="w-full">Save transfer</SubmitButton>
      </FormSection>
    </form>
  );
}

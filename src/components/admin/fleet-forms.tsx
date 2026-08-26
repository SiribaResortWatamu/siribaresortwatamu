"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveDriver, saveVehicle } from "@/app/actions/admin/operations";
import { IDLE } from "@/lib/action-state";
import {
  AdminField,
  FormFeedback,
  FormSection,
  SubmitButton,
} from "@/components/admin/form";
import type { Driver, Vehicle } from "@/lib/types";

const VEHICLE_TYPES = [
  "Saloon",
  "Minivan",
  "Minibus",
  "Safari 4x4",
  "SUV",
  "Coach",
  "Motorcycle",
];

export function DriverForm({
  driver,
  vehicles,
}: {
  driver?: Driver;
  vehicles: Vehicle[];
}) {
  const [state, formAction] = useActionState(saveDriver, IDLE);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="space-y-4">
      {driver && <input type="hidden" name="id" value={driver.id} />}
      <FormFeedback state={state} />

      <FormSection title={driver ? `Edit ${driver.name}` : "Add a driver"}>
        <AdminField label="Name" required error={errors.name}>
          <input name="name" className="input" required defaultValue={driver?.name ?? ""} />
        </AdminField>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Phone" required error={errors.phone}>
            <input
              name="phone"
              type="tel"
              className="input"
              required
              defaultValue={driver?.phone ?? ""}
              placeholder="+254 7…"
            />
          </AdminField>
          <AdminField label="WhatsApp" hint="digits only">
            <input
              name="whatsapp"
              type="tel"
              className="input"
              defaultValue={driver?.whatsapp ?? ""}
              placeholder="254700000000"
            />
          </AdminField>
        </div>

        <AdminField
          label="Email"
          hint="needed to email job details automatically"
        >
          <input
            name="email"
            type="email"
            className="input"
            defaultValue={driver?.email ?? ""}
          />
        </AdminField>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Licence number">
            <input
              name="licence_no"
              className="input"
              defaultValue={driver?.licence_no ?? ""}
            />
          </AdminField>
          <AdminField label="Usual vehicle">
            <select
              name="vehicle_id"
              defaultValue={driver?.vehicle_id ?? ""}
              className="select"
            >
              <option value="">None</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} — {vehicle.registration}
                </option>
              ))}
            </select>
          </AdminField>
        </div>

        <AdminField label="Status">
          <select
            name="status"
            defaultValue={driver?.status ?? "active"}
            className="select"
          >
            <option value="active">Active — available for jobs</option>
            <option value="inactive">Inactive — not currently driving</option>
          </select>
        </AdminField>

        <AdminField label="Notes">
          <textarea
            name="notes"
            rows={3}
            className="textarea"
            defaultValue={driver?.notes ?? ""}
            placeholder="Routes they know, languages, availability…"
          />
        </AdminField>

        <div className="flex gap-2">
          <SubmitButton className="flex-1">
            {driver ? "Save driver" : "Add driver"}
          </SubmitButton>
          <Link href="/admin/drivers" className="btn btn-outline btn-sm">
            Cancel
          </Link>
        </div>
      </FormSection>
    </form>
  );
}

export function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const [state, formAction] = useActionState(saveVehicle, IDLE);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="space-y-4">
      {vehicle && <input type="hidden" name="id" value={vehicle.id} />}
      <FormFeedback state={state} />

      <FormSection title={vehicle ? `Edit ${vehicle.name}` : "Add a vehicle"}>
        <AdminField label="Name" required error={errors.name}>
          <input
            name="name"
            className="input"
            required
            defaultValue={vehicle?.name ?? ""}
            placeholder="Toyota Noah — White"
          />
        </AdminField>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Registration" required error={errors.registration}>
            <input
              name="registration"
              className="input"
              required
              defaultValue={vehicle?.registration ?? ""}
              placeholder="KDA 123A"
            />
          </AdminField>
          <AdminField label="Type">
            <select
              name="vehicle_type"
              defaultValue={vehicle?.vehicle_type ?? "Saloon"}
              className="select"
            >
              {VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </AdminField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Passenger capacity">
            <input
              name="capacity"
              type="number"
              min={1}
              className="input"
              defaultValue={vehicle?.capacity ?? 4}
            />
          </AdminField>
          <AdminField label="Luggage capacity">
            <input
              name="luggage_capacity"
              type="number"
              min={0}
              className="input"
              defaultValue={vehicle?.luggage_capacity ?? 2}
            />
          </AdminField>
        </div>

        <AdminField label="Status">
          <select
            name="status"
            defaultValue={vehicle?.status ?? "active"}
            className="select"
          >
            <option value="active">Active — in service</option>
            <option value="inactive">Inactive — off the road</option>
          </select>
        </AdminField>

        <div className="flex gap-2">
          <SubmitButton className="flex-1">
            {vehicle ? "Save vehicle" : "Add vehicle"}
          </SubmitButton>
          <Link href="/admin/drivers" className="btn btn-outline btn-sm">
            Cancel
          </Link>
        </div>
      </FormSection>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { CalendarOff } from "lucide-react";
import { createBlock } from "@/app/actions/admin/bookings";
import { IDLE } from "@/lib/action-state";
import {
  AdminField,
  FormFeedback,
  FormSection,
  SubmitButton,
} from "@/components/admin/form";
import { toDateKey } from "@/lib/format";
import type { Apartment } from "@/lib/types";

/** Take dates off sale — for maintenance, an owner stay or a private event. */
export function BlockForm({ apartments }: { apartments: Apartment[] }) {
  const [state, formAction] = useActionState(createBlock, IDLE);
  const [selected, setSelected] = useState<string[]>([]);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const today = toDateKey(new Date());

  const allSelected =
    apartments.length > 0 && selected.length === apartments.length;

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <form action={formAction} className="space-y-4">
      <FormFeedback state={state} />

      <FormSection
        title="Block dates"
        description="Blocked nights cannot be booked, here or through a channel."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="From" required error={errors.startDate}>
            <input
              name="startDate"
              type="date"
              className="input"
              required
              defaultValue={today}
            />
          </AdminField>
          <AdminField
            label="Until"
            hint="the morning it is free again"
            required
            error={errors.endDate}
          >
            <input name="endDate" type="date" className="input" required />
          </AdminField>
        </div>

        <AdminField label="Reason">
          <select name="reason" defaultValue="maintenance" className="select">
            <option value="maintenance">Maintenance</option>
            <option value="owner_stay">Owner stay</option>
            <option value="private_event">Private event</option>
            <option value="other">Other</option>
          </select>
        </AdminField>

        <AdminField label="Which accommodation?" required>
          <label className="mb-2.5 flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) =>
                setSelected(event.target.checked ? apartments.map((a) => a.id) : [])
              }
              className="h-4 w-4 shrink-0 accent-[#2c6e6b]"
            />
            The entire property
          </label>

          <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-line p-3">
            {apartments.map((apartment) => (
              <label
                key={apartment.id}
                className="flex cursor-pointer items-center gap-2.5 text-sm"
              >
                <input
                  type="checkbox"
                  name="apartmentIds"
                  value={apartment.id}
                  checked={selected.includes(apartment.id)}
                  onChange={() => toggle(apartment.id)}
                  className="h-4 w-4 shrink-0 accent-[#2c6e6b]"
                />
                {apartment.name}
              </label>
            ))}
          </div>
        </AdminField>

        <AdminField label="Note" hint="optional, for your own reference">
          <input name="note" className="input" placeholder="Repainting the terrace" />
        </AdminField>

        <SubmitButton className="w-full">
          <CalendarOff size={14} strokeWidth={1.75} />
          Block these dates
        </SubmitButton>

        <p className="text-xs text-ink-muted">
          If a confirmed booking already occupies any of these nights, that accommodation
          is skipped and you are told which — an existing guest is never quietly
          displaced.
        </p>
      </FormSection>
    </form>
  );
}

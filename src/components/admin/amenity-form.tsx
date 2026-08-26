"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveAmenity } from "@/app/actions/admin/content";
import { IDLE } from "@/lib/action-state";
import {
  AdminField,
  FormFeedback,
  FormSection,
  StatusSelect,
  SubmitButton,
} from "@/components/admin/form";
import { AMENITY_ICON_NAMES, AmenityIcon } from "@/components/site/amenity-icon";
import { cn } from "@/lib/utils";
import type { Amenity } from "@/lib/types";

export function AmenityForm({ amenity }: { amenity?: Amenity }) {
  const [state, formAction] = useActionState(saveAmenity, IDLE);
  const [icon, setIcon] = useState(amenity?.icon ?? "sparkles");
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="space-y-4">
      {amenity && <input type="hidden" name="id" value={amenity.id} />}
      <input type="hidden" name="icon" value={icon} />
      <FormFeedback state={state} />

      <FormSection title={amenity ? `Edit ${amenity.name}` : "Add an amenity"}>
        <AdminField label="Name" required error={errors.name}>
          <input
            name="name"
            className="input"
            required
            defaultValue={amenity?.name ?? ""}
            placeholder="Swimming Pool"
          />
        </AdminField>

        <AdminField label="Description" hint="one short line">
          <input
            name="description"
            className="input"
            defaultValue={amenity?.description ?? ""}
            placeholder="Freshwater pool shaded by palms"
          />
        </AdminField>

        <AdminField label="Icon">
          <div className="grid max-h-52 grid-cols-6 gap-1.5 overflow-y-auto rounded-lg border border-line p-2">
            {AMENITY_ICON_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setIcon(name)}
                title={name}
                aria-label={name}
                aria-pressed={icon === name}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md transition-colors",
                  icon === name
                    ? "bg-ocean text-white"
                    : "text-ink-muted hover:bg-sand-deep hover:text-ink",
                )}
              >
                <AmenityIcon name={name} size={18} />
              </button>
            ))}
          </div>
        </AdminField>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Display order" hint="lower first">
            <input
              name="display_order"
              type="number"
              className="input"
              defaultValue={amenity?.display_order ?? 0}
            />
          </AdminField>
          <AdminField label="Status">
            <StatusSelect defaultValue={amenity?.status ?? "published"} />
          </AdminField>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={amenity?.is_featured ?? false}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#2c6e6b]"
          />
          <span>
            Featured
            <span className="block text-xs text-ink-muted">
              Shown on the homepage and at the top of the Amenities page.
            </span>
          </span>
        </label>

        <div className="flex gap-2">
          <SubmitButton className="flex-1">
            {amenity ? "Save amenity" : "Add amenity"}
          </SubmitButton>
          <Link href="/admin/amenities" className="btn btn-outline btn-sm">
            Cancel
          </Link>
        </div>
      </FormSection>
    </form>
  );
}

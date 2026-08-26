"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { linesToArray, slugify } from "@/lib/utils";

/**
 * CMS actions for the three bookable services plus the amenity catalogue.
 *
 * Creating a record is all it takes to publish a page: the public routes are
 * `[slug]` templates that read from these tables, so nothing in the frontend
 * needs editing when the owner adds a room, a safari or a transfer.
 */

// ---------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------
const photoSchema = z.array(
  z.object({
    storage_path: z.string().min(1),
    alt_text: z.string().nullable(),
    display_order: z.number().int(),
    is_cover: z.boolean(),
  }),
);

function parsePhotos(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !raw) return [];
  try {
    return photoSchema.parse(JSON.parse(raw));
  } catch {
    return [];
  }
}

/**
 * Replace a record's gallery.
 *
 * The partial unique index allows only one cover per parent, so the old rows
 * are cleared before the new ones land rather than updated in place.
 */
async function replacePhotos(
  table: "apartment_photos" | "safari_photos" | "transfer_photos",
  foreignKey: "apartment_id" | "safari_id" | "transfer_id",
  parentId: string,
  raw: FormDataEntryValue | null,
): Promise<string | null> {
  const photos = parsePhotos(raw);
  const db = supabaseAdmin();

  const { error: deleteError } = await db.from(table).delete().eq(foreignKey, parentId);
  if (deleteError) return deleteError.message;

  if (photos.length === 0) return null;

  // Guard against a payload that somehow carries two covers.
  let coverSeen = false;
  const rows = photos.map((photo) => {
    const isCover = photo.is_cover && !coverSeen;
    if (isCover) coverSeen = true;
    return { ...photo, [foreignKey]: parentId, is_cover: isCover };
  });
  if (!coverSeen && rows.length > 0) rows[0].is_cover = true;

  const { error } = await db.from(table).insert(rows);
  return error?.message ?? null;
}

function numberField(value: FormDataEntryValue | null, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function textField(value: FormDataEntryValue | null): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

const statusEnum = z.enum(["draft", "published", "hidden", "archived"]);

/** Slugs must be unique per table; suggest a fix rather than failing opaquely. */
async function slugTaken(
  table: string,
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  let query = supabaseAdmin().from(table).select("id").eq("slug", slug).limit(1);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query;
  return Boolean(data?.length);
}

// =====================================================================
// Accommodation
// =====================================================================
export async function saveApartment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = textField(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));

  if (!name) return actionError("A name is required.", { name: "Required" });
  if (!slug) return actionError("A slug is required.", { slug: "Required" });

  if (await slugTaken("apartments", slug, id ?? undefined)) {
    return actionError("That slug is already used by another apartment.", {
      slug: "Already in use",
    });
  }

  const status = statusEnum.safeParse(formData.get("status"));

  const record = {
    name,
    slug,
    short_description: textField(formData.get("short_description")),
    full_description: textField(formData.get("full_description")),
    property_type: String(formData.get("property_type") ?? "Apartment").trim(),
    location: textField(formData.get("location")),
    max_guests: Math.max(1, numberField(formData.get("max_guests"), 2)),
    bedrooms: Math.max(0, numberField(formData.get("bedrooms"), 1)),
    bathrooms: Math.max(0, numberField(formData.get("bathrooms"), 1)),
    beds: Math.max(0, numberField(formData.get("beds"), 1)),
    nightly_rate: Math.max(0, numberField(formData.get("nightly_rate"))),
    currency: String(formData.get("currency") ?? "KES").trim() || "KES",
    min_nights: Math.max(1, numberField(formData.get("min_nights"), 1)),
    cleaning_fee: Math.max(0, numberField(formData.get("cleaning_fee"))),
    deposit_percent: clampPercent(numberField(formData.get("deposit_percent"), 30)),
    amenity_ids: formData.getAll("amenityIds").map(String),
    housekeeping: String(formData.get("housekeeping") ?? "available"),
    status: status.success ? status.data : "draft",
    display_order: numberField(formData.get("display_order")),
    is_featured: formData.get("is_featured") === "on",
    seo_title: textField(formData.get("seo_title")),
    seo_description: textField(formData.get("seo_description")),
    airbnb_ical_url: textField(formData.get("airbnb_ical_url")),
    booking_com_ical_url: textField(formData.get("booking_com_ical_url")),
  };

  const db = supabaseAdmin();
  let apartmentId = id;

  if (apartmentId) {
    const { error } = await db.from("apartments").update(record).eq("id", apartmentId);
    if (error) return actionError(`Could not save: ${error.message}`);
  } else {
    const { data, error } = await db
      .from("apartments")
      .insert(record)
      .select("id")
      .single();
    if (error) return actionError(`Could not create: ${error.message}`);
    apartmentId = data.id as string;
  }

  const photoError = await replacePhotos(
    "apartment_photos",
    "apartment_id",
    apartmentId,
    formData.get("photos"),
  );
  if (photoError) return actionError(`Saved, but the gallery failed: ${photoError}`);

  revalidatePath("/accommodation");
  revalidatePath(`/accommodation/${slug}`);
  revalidatePath("/");
  revalidatePath("/admin/accommodation");

  if (!id) redirect(`/admin/accommodation/${apartmentId}?created=1`);
  return actionSuccess("Accommodation saved", { detail: `/accommodation/${slug}` });
}

// =====================================================================
// Safaris
// =====================================================================
const itinerarySchema = z.array(
  z.object({
    day_number: z.number().int().min(1),
    display_order: z.number().int(),
    title: z.string().min(1),
    description: z.string().nullable(),
    activities: z.array(z.string()),
    accommodation: z.string().nullable(),
    meals: z.string().nullable(),
  }),
);

export async function saveSafari(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = textField(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));

  if (!name) return actionError("A name is required.", { name: "Required" });
  if (!slug) return actionError("A slug is required.", { slug: "Required" });

  if (await slugTaken("safari_packages", slug, id ?? undefined)) {
    return actionError("That slug is already used by another safari.", {
      slug: "Already in use",
    });
  }

  const status = statusEnum.safeParse(formData.get("status"));
  const displayMode = z
    .enum(["show_price", "from_price", "on_enquiry"])
    .safeParse(formData.get("price_display_mode"));

  const record = {
    name,
    slug,
    short_description: textField(formData.get("short_description")),
    full_description: textField(formData.get("full_description")),
    destination: textField(formData.get("destination")),
    duration: textField(formData.get("duration")),
    duration_days: Math.max(1, numberField(formData.get("duration_days"), 1)),
    starting_location: textField(formData.get("starting_location")),
    ending_location: textField(formData.get("ending_location")),
    safari_type: textField(formData.get("safari_type")),
    price: Math.max(0, numberField(formData.get("price"))),
    currency: String(formData.get("currency") ?? "USD").trim() || "USD",
    price_display_mode: displayMode.success ? displayMode.data : "from_price",
    highlights: linesToArray(formData.get("highlights")),
    included: linesToArray(formData.get("included")),
    excluded: linesToArray(formData.get("excluded")),
    optional_extras: linesToArray(formData.get("optional_extras")),
    important_info: textField(formData.get("important_info")),
    status: status.success ? status.data : "draft",
    display_order: numberField(formData.get("display_order")),
    is_featured: formData.get("is_featured") === "on",
    seo_title: textField(formData.get("seo_title")),
    seo_description: textField(formData.get("seo_description")),
  };

  const db = supabaseAdmin();
  let safariId = id;

  if (safariId) {
    const { error } = await db.from("safari_packages").update(record).eq("id", safariId);
    if (error) return actionError(`Could not save: ${error.message}`);
  } else {
    const { data, error } = await db
      .from("safari_packages")
      .insert(record)
      .select("id")
      .single();
    if (error) return actionError(`Could not create: ${error.message}`);
    safariId = data.id as string;
  }

  // Itinerary: the builder submits the whole list, so replace it wholesale.
  const rawItinerary = formData.get("itinerary");
  if (typeof rawItinerary === "string" && rawItinerary) {
    try {
      const days = itinerarySchema.parse(JSON.parse(rawItinerary));
      await db.from("safari_itinerary_days").delete().eq("safari_id", safariId);
      if (days.length > 0) {
        const { error } = await db
          .from("safari_itinerary_days")
          .insert(days.map((day) => ({ ...day, safari_id: safariId })));
        if (error) return actionError(`Saved, but the itinerary failed: ${error.message}`);
      }
    } catch {
      return actionError("The itinerary could not be read. Please check the days.");
    }
  }

  const photoError = await replacePhotos(
    "safari_photos",
    "safari_id",
    safariId,
    formData.get("photos"),
  );
  if (photoError) return actionError(`Saved, but the gallery failed: ${photoError}`);

  revalidatePath("/safaris");
  revalidatePath(`/safaris/${slug}`);
  revalidatePath("/");
  revalidatePath("/admin/safaris");

  if (!id) redirect(`/admin/safaris/${safariId}?created=1`);
  return actionSuccess("Safari saved", { detail: `/safaris/${slug}` });
}

// =====================================================================
// Transfers
// =====================================================================
export async function saveTransfer(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = textField(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));

  if (!name) return actionError("A name is required.", { name: "Required" });
  if (!slug) return actionError("A slug is required.", { slug: "Required" });

  if (await slugTaken("transfer_services", slug, id ?? undefined)) {
    return actionError("That slug is already used by another transfer service.", {
      slug: "Already in use",
    });
  }

  const status = statusEnum.safeParse(formData.get("status"));
  const method = z
    .enum(["fixed", "per_person", "per_vehicle", "hourly", "on_enquiry"])
    .safeParse(formData.get("pricing_method"));

  const record = {
    name,
    slug,
    short_description: textField(formData.get("short_description")),
    full_description: textField(formData.get("full_description")),
    service_type: String(formData.get("service_type") ?? "Airport Transfer").trim(),
    pickup_locations: linesToArray(formData.get("pickup_locations")),
    dropoff_locations: linesToArray(formData.get("dropoff_locations")),
    vehicle_type: textField(formData.get("vehicle_type")),
    passenger_capacity: Math.max(1, numberField(formData.get("passenger_capacity"), 4)),
    luggage_capacity: Math.max(0, numberField(formData.get("luggage_capacity"), 2)),
    journey_time: textField(formData.get("journey_time")),
    pricing_method: method.success ? method.data : "fixed",
    price: Math.max(0, numberField(formData.get("price"))),
    currency: String(formData.get("currency") ?? "KES").trim() || "KES",
    included: linesToArray(formData.get("included")),
    excluded: linesToArray(formData.get("excluded")),
    additional_charges: linesToArray(formData.get("additional_charges")),
    status: status.success ? status.data : "draft",
    display_order: numberField(formData.get("display_order")),
    is_featured: formData.get("is_featured") === "on",
    seo_title: textField(formData.get("seo_title")),
    seo_description: textField(formData.get("seo_description")),
  };

  const db = supabaseAdmin();
  let transferId = id;

  if (transferId) {
    const { error } = await db
      .from("transfer_services")
      .update(record)
      .eq("id", transferId);
    if (error) return actionError(`Could not save: ${error.message}`);
  } else {
    const { data, error } = await db
      .from("transfer_services")
      .insert(record)
      .select("id")
      .single();
    if (error) return actionError(`Could not create: ${error.message}`);
    transferId = data.id as string;
  }

  const photoError = await replacePhotos(
    "transfer_photos",
    "transfer_id",
    transferId,
    formData.get("photos"),
  );
  if (photoError) return actionError(`Saved, but the gallery failed: ${photoError}`);

  revalidatePath("/transfers");
  revalidatePath(`/transfers/${slug}`);
  revalidatePath("/");
  revalidatePath("/admin/transfers");

  if (!id) redirect(`/admin/transfers/${transferId}?created=1`);
  return actionSuccess("Transfer service saved", { detail: `/transfers/${slug}` });
}

// =====================================================================
// Status changes (publish / unpublish / archive)
// =====================================================================
const TABLES = {
  accommodation: { table: "apartments", path: "/accommodation" },
  safaris: { table: "safari_packages", path: "/safaris" },
  transfers: { table: "transfer_services", path: "/transfers" },
} as const;

export async function setContentStatus(formData: FormData): Promise<void> {
  await requireAdmin();

  const kind = String(formData.get("kind") ?? "") as keyof typeof TABLES;
  const id = String(formData.get("id") ?? "");
  const status = statusEnum.safeParse(formData.get("status"));
  const target = TABLES[kind];

  if (!target || !id || !status.success) return;

  await supabaseAdmin().from(target.table).update({ status: status.data }).eq("id", id);

  revalidatePath(target.path);
  revalidatePath("/");
  revalidatePath(`/admin/${kind}`);
}

// =====================================================================
// Amenities
// =====================================================================
export async function saveAmenity(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = textField(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return actionError("A name is required.", { name: "Required" });

  const status = statusEnum.safeParse(formData.get("status"));

  const record = {
    name,
    icon: String(formData.get("icon") ?? "sparkles").trim() || "sparkles",
    description: textField(formData.get("description")),
    display_order: numberField(formData.get("display_order")),
    is_featured: formData.get("is_featured") === "on",
    status: status.success ? status.data : "published",
  };

  const db = supabaseAdmin();
  const { error } = id
    ? await db.from("amenities").update(record).eq("id", id)
    : await db.from("amenities").insert(record);

  if (error) {
    return error.code === "23505"
      ? actionError("An amenity with that name already exists.", {
          name: "Already in use",
        })
      : actionError(`Could not save: ${error.message}`);
  }

  revalidatePath("/amenities");
  revalidatePath("/");
  revalidatePath("/admin/amenities");

  return actionSuccess(id ? "Amenity updated" : "Amenity added");
}

export async function deleteAmenity(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const db = supabaseAdmin();

  // Detach it from every apartment first so no record points at a ghost.
  const { data: apartments } = await db
    .from("apartments")
    .select("id, amenity_ids")
    .contains("amenity_ids", [id]);

  for (const apartment of apartments ?? []) {
    await db
      .from("apartments")
      .update({
        amenity_ids: (apartment.amenity_ids as string[]).filter((a) => a !== id),
      })
      .eq("id", apartment.id);
  }

  await db.from("amenities").delete().eq("id", id);

  revalidatePath("/amenities");
  revalidatePath("/admin/amenities");
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

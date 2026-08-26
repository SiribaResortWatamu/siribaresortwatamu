"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "apartment-photos";
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
}

function sanitizeFilename(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
}

function revalidateApartment(apartmentId: string, slug?: string) {
  revalidatePath(`/admin/apartments/${apartmentId}`);
  revalidatePath("/accommodation");
  if (slug) revalidatePath(`/accommodation/${slug}`);
}

export async function uploadApartmentPhotos(
  apartmentId: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const admin = createAdminClient();

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false, error: "No files selected" };

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return { ok: false, error: `${file.name}: unsupported file type` };
    }
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, error: `${file.name}: file too large (max 8MB)` };
    }
  }

  const { data: apartment } = await admin
    .from("apartments")
    .select("slug")
    .eq("id", apartmentId)
    .maybeSingle();

  const { data: existing } = await admin
    .from("apartment_photos")
    .select("order, is_cover")
    .eq("apartment_id", apartmentId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextOrder = (existing?.order ?? -1) + 1;
  let hasCover = false;
  const { data: coverRow } = await admin
    .from("apartment_photos")
    .select("id")
    .eq("apartment_id", apartmentId)
    .eq("is_cover", true)
    .maybeSingle();
  hasCover = !!coverRow;

  for (const file of files) {
    const path = `${apartmentId}/${Date.now()}-${sanitizeFilename(file.name)}`;
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) return { ok: false, error: uploadError.message };

    const { error: insertError } = await admin.from("apartment_photos").insert({
      apartment_id: apartmentId,
      storage_path: path,
      order: nextOrder++,
      is_cover: !hasCover,
    });
    if (insertError) return { ok: false, error: insertError.message };
    hasCover = true;
  }

  revalidateApartment(apartmentId, apartment?.slug);
  return { ok: true };
}

export async function deleteApartmentPhoto(
  apartmentId: string,
  photoId: string,
  storagePath: string
): Promise<ActionResult> {
  await requireAdmin();
  const admin = createAdminClient();

  await admin.storage.from(BUCKET).remove([storagePath]);
  const { error } = await admin.from("apartment_photos").delete().eq("id", photoId);
  if (error) return { ok: false, error: error.message };

  // If the deleted photo was the cover, promote the next remaining photo.
  const { data: remaining } = await admin
    .from("apartment_photos")
    .select("id")
    .eq("apartment_id", apartmentId)
    .order("order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (remaining) {
    const { data: stillHasCover } = await admin
      .from("apartment_photos")
      .select("id")
      .eq("apartment_id", apartmentId)
      .eq("is_cover", true)
      .maybeSingle();
    if (!stillHasCover) {
      await admin.from("apartment_photos").update({ is_cover: true }).eq("id", remaining.id);
    }
  }

  revalidateApartment(apartmentId);
  return { ok: true };
}

export async function setCoverPhoto(apartmentId: string, photoId: string): Promise<ActionResult> {
  await requireAdmin();
  const admin = createAdminClient();

  const { error: unsetError } = await admin
    .from("apartment_photos")
    .update({ is_cover: false })
    .eq("apartment_id", apartmentId);
  if (unsetError) return { ok: false, error: unsetError.message };

  const { error: setError } = await admin
    .from("apartment_photos")
    .update({ is_cover: true })
    .eq("id", photoId);
  if (setError) return { ok: false, error: setError.message };

  revalidateApartment(apartmentId);
  return { ok: true };
}

export async function moveApartmentPhoto(
  apartmentId: string,
  photoId: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: photos } = await admin
    .from("apartment_photos")
    .select("id, order")
    .eq("apartment_id", apartmentId)
    .order("order", { ascending: true });

  if (!photos) return { ok: false, error: "Could not load photos" };

  const index = photos.findIndex((p) => p.id === photoId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= photos.length) return { ok: true };

  const a = photos[index];
  const b = photos[swapIndex];

  await admin.from("apartment_photos").update({ order: b.order }).eq("id", a.id);
  await admin.from("apartment_photos").update({ order: a.order }).eq("id", b.id);

  revalidateApartment(apartmentId);
  return { ok: true };
}

import { createClient } from "@/lib/supabase/server";
import type { Apartment, ApartmentPhoto } from "@/lib/supabase/types";

export const FALLBACK_APARTMENT_IMAGE = "/images/room.png";

export type ApartmentWithPhotos = Apartment & { photos: ApartmentPhoto[] };

async function withPhotos(apartments: Apartment[]): Promise<ApartmentWithPhotos[]> {
  if (apartments.length === 0) return [];

  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("apartment_photos")
    .select("*")
    .in(
      "apartment_id",
      apartments.map((a) => a.id)
    )
    .order("order", { ascending: true });

  return apartments.map((apartment) => ({
    ...apartment,
    photos: (photos ?? []).filter((p) => p.apartment_id === apartment.id),
  }));
}

export async function getActiveApartments(): Promise<ApartmentWithPhotos[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("apartments")
    .select("*")
    .eq("is_archived", false)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return withPhotos(data ?? []);
}

export async function getFeaturedApartments(limit = 3): Promise<ApartmentWithPhotos[]> {
  const apartments = await getActiveApartments();
  return apartments.filter((a) => a.feature_on_homepage).slice(0, limit);
}

export async function getApartmentBySlug(slug: string): Promise<ApartmentWithPhotos | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("apartments")
    .select("*")
    .eq("slug", slug)
    .eq("is_archived", false)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const [withPhotosResult] = await withPhotos([data]);
  return withPhotosResult;
}

export async function getRelatedApartments(
  excludeSlug: string,
  limit = 3
): Promise<ApartmentWithPhotos[]> {
  const apartments = await getActiveApartments();
  return apartments.filter((a) => a.slug !== excludeSlug).slice(0, limit);
}

const PHOTOS_BUCKET = "apartment-photos";

// Storage public URLs are deterministic, so no need for an async
// storage.from(bucket).getPublicUrl() round-trip per image.
function publicPhotoUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PHOTOS_BUCKET}/${storagePath}`;
}

export function coverImage(apartment: ApartmentWithPhotos): string {
  const cover = apartment.photos.find((p) => p.is_cover) ?? apartment.photos[0];
  return cover ? publicPhotoUrl(cover.storage_path) : FALLBACK_APARTMENT_IMAGE;
}

export function galleryImages(apartment: ApartmentWithPhotos): string[] {
  if (apartment.photos.length === 0) return [FALLBACK_APARTMENT_IMAGE];
  return apartment.photos.map((p) => publicPhotoUrl(p.storage_path));
}

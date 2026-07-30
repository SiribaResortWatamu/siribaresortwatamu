import { createClient } from "@/lib/supabase/server";
import type { Apartment, ApartmentPhoto } from "@/lib/supabase/types";
import { publicPhotoUrl } from "@/lib/photo-url";

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

export function coverImage(apartment: ApartmentWithPhotos): string {
  const cover = apartment.photos.find((p) => p.is_cover) ?? apartment.photos[0];
  return cover ? publicPhotoUrl(cover.storage_path) : FALLBACK_APARTMENT_IMAGE;
}

// Cover photo always leads the gallery — it's what room-details uses as the
// page header image, so "first uploaded photo" (which becomes the cover by
// default) has to actually render first regardless of its `order` value,
// and stay first if the admin later re-covers with a different photo.
export function galleryImages(apartment: ApartmentWithPhotos): string[] {
  if (apartment.photos.length === 0) return [FALLBACK_APARTMENT_IMAGE];
  const sorted = [...apartment.photos].sort((a, b) => {
    if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
    return a.order - b.order;
  });
  return sorted.map((p) => publicPhotoUrl(p.storage_path));
}

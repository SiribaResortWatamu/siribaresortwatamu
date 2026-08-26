import { cache } from "react";
import { supabasePublic } from "@/lib/supabase/public";
import type {
  Amenity,
  ApartmentWithPhotos,
  SafariWithDetail,
  TransferWithPhotos,
} from "@/lib/types";

/**
 * Public content reads.
 *
 * These use the cookie-free anon client: the website's content is the same
 * for everyone, so binding it to the request's cookies would force every
 * listing page to render per request for no benefit. Row level security is
 * still what decides visibility — a draft, hidden or archived record cannot
 * reach the website even if a query here forgets to filter.
 *
 * Each read is wrapped in `safely`, so a listing page shows its empty state
 * instead of a 500 if the database is briefly unreachable.
 */

const APARTMENT_SELECT = "*, apartment_photos(*)";
const SAFARI_SELECT = "*, safari_photos(*), safari_itinerary_days(*)";
const TRANSFER_SELECT = "*, transfer_photos(*)";

async function safely<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    // Next signals redirects, notFound and dynamic-rendering bailouts by
    // throwing. Those carry a `digest` and must never be swallowed here.
    if (error && typeof error === "object" && "digest" in error) throw error;

    console.error(`[content] ${label} failed`, error);
    return fallback;
  }
}

export const listApartments = cache(async (): Promise<ApartmentWithPhotos[]> =>
  safely(
    "listApartments",
    async () => {
      const { data } = await supabasePublic()
        .from("apartments")
        .select(APARTMENT_SELECT)
        .eq("status", "published")
        .order("display_order")
        .order("name");
      return (data as ApartmentWithPhotos[]) ?? [];
    },
    [],
  ),
);

export const getApartment = cache(
  async (slug: string): Promise<ApartmentWithPhotos | null> =>
    safely(
      `getApartment(${slug})`,
      async () => {
        const { data } = await supabasePublic()
          .from("apartments")
          .select(APARTMENT_SELECT)
          .eq("slug", slug)
          .eq("status", "published")
          .maybeSingle();
        return (data as ApartmentWithPhotos) ?? null;
      },
      null,
    ),
);

export const listSafaris = cache(async (): Promise<SafariWithDetail[]> =>
  safely(
    "listSafaris",
    async () => {
      const { data } = await supabasePublic()
        .from("safari_packages")
        .select(SAFARI_SELECT)
        .eq("status", "published")
        .order("display_order")
        .order("name");
      return (data as SafariWithDetail[]) ?? [];
    },
    [],
  ),
);

export const getSafari = cache(async (slug: string): Promise<SafariWithDetail | null> =>
  safely(
    `getSafari(${slug})`,
    async () => {
      const { data } = await supabasePublic()
        .from("safari_packages")
        .select(SAFARI_SELECT)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (!data) return null;

      const safari = data as SafariWithDetail;
      safari.safari_itinerary_days = [...(safari.safari_itinerary_days ?? [])].sort(
        (a, b) => a.display_order - b.display_order || a.day_number - b.day_number,
      );
      return safari;
    },
    null,
  ),
);

export const listTransfers = cache(async (): Promise<TransferWithPhotos[]> =>
  safely(
    "listTransfers",
    async () => {
      const { data } = await supabasePublic()
        .from("transfer_services")
        .select(TRANSFER_SELECT)
        .eq("status", "published")
        .order("display_order")
        .order("name");
      return (data as TransferWithPhotos[]) ?? [];
    },
    [],
  ),
);

export const getTransfer = cache(async (slug: string): Promise<TransferWithPhotos | null> =>
  safely(
    `getTransfer(${slug})`,
    async () => {
      const { data } = await supabasePublic()
        .from("transfer_services")
        .select(TRANSFER_SELECT)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      return (data as TransferWithPhotos) ?? null;
    },
    null,
  ),
);

export const listAmenities = cache(async (): Promise<Amenity[]> =>
  safely(
    "listAmenities",
    async () => {
      const { data } = await supabasePublic()
        .from("amenities")
        .select("*")
        .eq("status", "published")
        .order("display_order")
        .order("name");
      return (data as Amenity[]) ?? [];
    },
    [],
  ),
);

/** Amenities referenced by one accommodation, in catalogue order. */
export const amenitiesByIds = cache(async (ids: string[]): Promise<Amenity[]> => {
  if (!ids?.length) return [];
  return safely(
    "amenitiesByIds",
    async () => {
      const { data } = await supabasePublic()
        .from("amenities")
        .select("*")
        .in("id", ids)
        .eq("status", "published")
        .order("display_order");
      return (data as Amenity[]) ?? [];
    },
    [],
  );
});

/**
 * Nights that cannot be booked, for the public availability calendar.
 *
 * If this ever fails it returns an empty list, which shows the calendar as
 * fully open. That is safe: the booking action re-checks availability and the
 * database constraint is the final word, so the worst case is a guest picking
 * dates and being asked to choose again.
 */
export async function getUnavailableDates(apartmentId: string): Promise<string[]> {
  return safely(
    "getUnavailableDates",
    async () => {
      const { data, error } = await supabasePublic().rpc("get_unavailable_dates", {
        p_apartment_id: apartmentId,
      });
      if (error || !data) return [];
      return (data as { get_unavailable_dates: string }[] | string[]).map((row) =>
        typeof row === "string" ? row : row.get_unavailable_dates,
      );
    },
    [],
  );
}

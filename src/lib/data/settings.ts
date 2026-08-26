import { cache } from "react";
import { supabasePublic } from "@/lib/supabase/public";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PublicSettings, SiteSettings } from "@/lib/types";

/** Used when the database is unreachable, so the site still renders. */
const FALLBACK: PublicSettings = {
  property_name: "Siriba Resort Watamu",
  tagline: "Your Coastal Escape Starts Here",
  logo_path: null,
  address: "Watamu, Kilifi County, Kenya",
  phone: null,
  whatsapp: null,
  email: null,
  facebook_url: null,
  instagram_url: null,
  tripadvisor_url: null,
  map_embed_url: null,
  default_currency: "KES",
  hide_prices: false,
  usd_to_kes_rate: 129,
  check_in_time: "14:00",
  check_out_time: "10:00",
  booking_terms: null,
  cancellation_policy: null,
};

/**
 * Public-facing settings, read through a security-definer function so the
 * owner's notification preferences and internal fields are never exposed.
 *
 * Uses the cookie-free client: these values are identical for every visitor,
 * so the header, footer and price display stay statically renderable.
 */
export const getPublicSettings = cache(async (): Promise<PublicSettings> => {
  try {
    const { data, error } = await supabasePublic().rpc("get_public_settings");
    if (error || !data) return FALLBACK;
    return { ...FALLBACK, ...(data as PublicSettings) };
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[settings] falling back to defaults", error);
    return FALLBACK;
  }
});

/** Full settings row — admin only. */
export const getSettings = cache(async (): Promise<SiteSettings | null> => {
  const { data } = await supabaseAdmin()
    .from("site_settings")
    .select("*")
    .eq("id", true)
    .single();
  return (data as SiteSettings) ?? null;
});

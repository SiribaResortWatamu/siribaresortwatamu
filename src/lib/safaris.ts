import { createClient } from "@/lib/supabase/server";
import type { SafariPackage } from "@/lib/supabase/types";

export const FALLBACK_SAFARI_IMAGE = "/images/hero-2.png";

export async function getActiveSafaris(): Promise<SafariPackage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("safari_packages")
    .select("*")
    .eq("is_archived", false)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getSafariBySlug(slug: string): Promise<SafariPackage | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("safari_packages")
    .select("*")
    .eq("slug", slug)
    .eq("is_archived", false)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function safariCoverImage(safari: SafariPackage): string {
  return safari.images[0] ?? FALLBACK_SAFARI_IMAGE;
}

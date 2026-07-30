import { createClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/lib/supabase/types";

const DEFAULTS: SiteSettings = { id: 1, show_prices: true, usd_to_kes_rate: 130 };

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return data ?? DEFAULTS;
}

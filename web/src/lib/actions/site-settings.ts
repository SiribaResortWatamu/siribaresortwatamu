"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateSiteSettings(input: {
  show_prices: boolean;
  usd_to_kes_rate: number;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { error } = await supabase
    .from("site_settings")
    .update({ show_prices: input.show_prices, usd_to_kes_rate: input.usd_to_kes_rate })
    .eq("id", 1);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

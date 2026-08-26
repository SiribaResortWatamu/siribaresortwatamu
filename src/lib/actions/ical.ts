"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncApartmentCalendars, type SyncResult } from "@/lib/ical-sync";
import type { ExternalCalendarLink } from "@/lib/supabase/types";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return supabase;
}

export async function updateExternalCalendars(
  apartmentId: string,
  calendars: ExternalCalendarLink[]
): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const cleaned = calendars.filter((c) => c.label.trim() && c.url.trim());

  const { error } = await supabase
    .from("apartments")
    .update({ external_ical_urls: cleaned })
    .eq("id", apartmentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/apartments/${apartmentId}`);
  return { ok: true };
}

export async function syncApartmentCalendarsAction(
  apartmentId: string
): Promise<{ ok: true; results: SyncResult[] } | { ok: false; error: string }> {
  await requireAdmin();
  const results = await syncApartmentCalendars(apartmentId);
  revalidatePath("/admin/calendar");
  return { ok: true, results };
}

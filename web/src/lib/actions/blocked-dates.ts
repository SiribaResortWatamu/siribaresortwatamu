"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { blockedDateInputSchema, type BlockedDateInput } from "@/lib/validation";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return { supabase, userId: user.id };
}

export async function addBlockedDate(input: BlockedDateInput): Promise<ActionResult> {
  const { supabase, userId } = await requireAdmin();
  const parsed = blockedDateInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const { error } = await supabase.from("blocked_dates").insert({
    apartment_id: data.apartmentId,
    start_date: data.startDate,
    end_date: data.endDate,
    reason: data.reason || null,
    created_by: userId,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/calendar");
  return { ok: true };
}

// Bound to a <form action>, so void-returning (see the same tradeoff note in
// setApartmentArchived).
export async function removeBlockedDate(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("blocked_dates").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/calendar");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return supabase;
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function updateBookingStatus(
  id: string,
  status: "confirmed" | "cancelled"
) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
}

export async function updateBookingPayment(id: string, payment_status: "paid" | "unpaid") {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("bookings").update({ payment_status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
}

export async function updateSafariBookingStatus(
  id: string,
  status: "confirmed" | "cancelled"
) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("safari_bookings").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/safaris");
}

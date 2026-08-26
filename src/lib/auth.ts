import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
}

/**
 * Signed-in staff member, or null.
 *
 * Membership of `admin_users` is what grants access — simply having a
 * Supabase account is not enough, so an accidental public sign-up cannot
 * reach the dashboard. Row level security enforces the same rule on every
 * query, and the middleware turns visitors away before they get here.
 */
export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabaseAdmin()
    .from("admin_users")
    .select("user_id, email, full_name, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.user_id as string,
    email: (data.email as string) ?? user.email ?? "",
    fullName: (data.full_name as string) ?? null,
    role: (data.role as string) ?? "owner",
  };
});

/** Use at the top of any admin page or action. Never returns null. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

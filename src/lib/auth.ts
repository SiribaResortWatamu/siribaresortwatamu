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
 * Why a signed-in visitor may still not be staff.
 *
 * These three cases have to stay distinct. Collapsing "not an admin" into
 * "signed out" is what used to send the dashboard into a redirect loop: the
 * layout bounced the visitor to /admin/login, the middleware saw a perfectly
 * valid session there and bounced them straight back. On a client-side
 * navigation that loop renders as a blank page rather than a browser error,
 * which makes it needlessly hard to diagnose.
 */
export type AdminAccess =
  | { status: "admin"; user: AdminUser }
  | { status: "signed-out" }
  | { status: "not-admin"; email: string };

/**
 * Resolve what the current session is allowed to do.
 *
 * Membership of `admin_users` is what grants access — simply having a
 * Supabase account is not enough, so an accidental public sign-up cannot
 * reach the dashboard. Row level security enforces the same rule on every
 * query, and the middleware turns signed-out visitors away before they get
 * here.
 */
export const getAdminAccess = cache(async (): Promise<AdminAccess> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "signed-out" };

  const { data } = await supabaseAdmin()
    .from("admin_users")
    .select("user_id, email, full_name, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return { status: "not-admin", email: user.email ?? "" };

  return {
    status: "admin",
    user: {
      id: data.user_id as string,
      email: (data.email as string) ?? user.email ?? "",
      fullName: (data.full_name as string) ?? null,
      role: (data.role as string) ?? "owner",
    },
  };
});

/** Signed-in staff member, or null. */
export async function getAdminUser(): Promise<AdminUser | null> {
  const access = await getAdminAccess();
  return access.status === "admin" ? access.user : null;
}

/**
 * Use at the top of any admin page or action. Never returns null.
 *
 * The layout renders an explanation for a signed-in non-admin before any
 * child gets here, so in practice this only redirects the signed out.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const access = await getAdminAccess();
  if (access.status !== "admin") redirect("/admin/login");
  return access.user;
}

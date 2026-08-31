import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { NotAuthorised } from "@/components/admin/not-authorised";
import { getAdminAccess } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s — Siriba Dashboard" },
  robots: { index: false, follow: false },
};

// Counts and lists must reflect what just happened, never a cached page.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getAdminAccess();

  // A valid session that is not staff gets an explanation, never a bounce
  // back to the login page — the middleware would only send them here again.
  if (access.status === "signed-out") redirect("/admin/login");
  if (access.status === "not-admin") return <NotAuthorised email={access.email} />;

  const user = access.user;
  const badges = await getBadgeCounts();

  return (
    <div className="min-h-screen bg-sand lg:flex">
      <AdminNav user={user} badges={badges} />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Unactioned work, shown against the relevant nav entries. */
async function getBadgeCounts() {
  const db = supabaseAdmin();

  const [bookings, enquiries, transfers, messages] = await Promise.all([
    db
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("booking_status", ["pending", "held"]),
    db
      .from("safari_enquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    db
      .from("transfer_bookings")
      .select("id", { count: "exact", head: true })
      .eq("booking_status", "pending"),
    db
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "unread"),
  ]);

  return {
    bookings: bookings.count ?? 0,
    enquiries: enquiries.count ?? 0,
    transfers: transfers.count ?? 0,
    messages: messages.count ?? 0,
  };
}

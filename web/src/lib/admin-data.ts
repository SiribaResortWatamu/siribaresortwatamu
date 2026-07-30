import { createClient } from "@/lib/supabase/server";
import type { Apartment, BlockedDate, Booking, SafariBooking } from "@/lib/supabase/types";

export type BookingWithApartment = Booking & { apartments: { name: string } | null };
export type BlockedDateWithApartment = BlockedDate & { apartments: { name: string } | null };

export async function getAllBookings(): Promise<BookingWithApartment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, apartments(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as BookingWithApartment[];
}

export async function getAllSafariBookings(): Promise<SafariBooking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("safari_bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAllBlockedDates(): Promise<BlockedDateWithApartment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blocked_dates")
    .select("*, apartments(name)")
    .order("start_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as BlockedDateWithApartment[];
}

export async function getAllApartmentsForAdmin(): Promise<Pick<Apartment, "id" | "name">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("apartments")
    .select("id, name")
    .eq("is_archived", false)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getAdminStats() {
  const [bookings, safariBookings] = await Promise.all([
    getAllBookings(),
    getAllSafariBookings(),
  ]);

  const activeBookings = bookings.filter((b) => b.status !== "cancelled");
  const unpaidBookings = activeBookings.filter((b) => b.payment_status === "unpaid");
  const activeSafaris = safariBookings.filter((s) => s.status !== "cancelled");

  return {
    activeBookingsCount: activeBookings.length,
    unpaidCount: unpaidBookings.length,
    safariCount: activeSafaris.length,
    recentBookings: activeBookings.slice(0, 6),
  };
}

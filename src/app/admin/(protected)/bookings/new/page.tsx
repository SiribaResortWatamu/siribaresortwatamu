import { PageHeader } from "@/components/admin/ui";
import { NewBookingForm } from "@/components/admin/new-booking-form";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Apartment } from "@/lib/types";

export const metadata = { title: "New Booking" };

export default async function NewBookingPage() {
  const { data } = await supabaseAdmin()
    .from("apartments")
    .select("*")
    .neq("status", "archived")
    .order("display_order")
    .order("name");

  return (
    <div className="space-y-6">
      <PageHeader
        title="New booking"
        subtitle="For reservations taken by phone, WhatsApp or in person."
        back={{ href: "/admin/bookings", label: "Bookings" }}
      />
      <NewBookingForm apartments={(data as Apartment[]) ?? []} />
    </div>
  );
}

import { PageHeader } from "@/components/admin/ui";
import { ApartmentForm } from "@/components/admin/apartment-form";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/env";
import type { Amenity } from "@/lib/types";

export const metadata = { title: "New Accommodation" };

export default async function NewAccommodationPage() {
  const { data } = await supabaseAdmin()
    .from("amenities")
    .select("*")
    .neq("status", "archived")
    .order("display_order")
    .order("name");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add accommodation"
        subtitle="Fill this in and the public page builds itself from the template."
        back={{ href: "/admin/accommodation", label: "Accommodation" }}
      />
      <ApartmentForm amenities={(data as Amenity[]) ?? []} siteUrl={siteUrl()} />
    </div>
  );
}

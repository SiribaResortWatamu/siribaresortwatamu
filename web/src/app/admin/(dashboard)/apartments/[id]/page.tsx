import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ApartmentForm from "@/components/admin/ApartmentForm";
import ApartmentPhotoManager from "@/components/admin/ApartmentPhotoManager";

type Params = Promise<{ id: string }>;

export default async function EditApartmentPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: apartment, error } = await supabase
    .from("apartments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!apartment) notFound();

  const { data: photos } = await supabase
    .from("apartment_photos")
    .select("*")
    .eq("apartment_id", id)
    .order("order", { ascending: true });

  return (
    <div>
      <header className="mb-8 border-b border-hairline pb-4">
        <h2 className="font-display text-2xl text-ink">Edit Apartment</h2>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <ApartmentForm
            mode="edit"
            apartmentId={apartment.id}
            initialValues={{
              name: apartment.name,
              slug: apartment.slug,
              description: apartment.description,
              price_usd: apartment.price_usd,
              guests: apartment.guests,
              bedrooms: apartment.bedrooms,
              bathrooms: apartment.bathrooms,
              feature_on_homepage: apartment.feature_on_homepage,
              sort_order: apartment.sort_order,
              features: apartment.features,
            }}
          />
        </div>

        <div className="h-fit rounded-2xl bg-white p-8 shadow-sm">
          <h3 className="mb-4 font-display text-xl text-ink">Photo Gallery</h3>
          <ApartmentPhotoManager apartmentId={apartment.id} photos={photos ?? []} />
        </div>
      </div>
    </div>
  );
}

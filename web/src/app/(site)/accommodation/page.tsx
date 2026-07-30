import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ApartmentCard from "@/components/ApartmentCard";
import { getActiveApartments } from "@/lib/apartments";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Accommodation",
  description: "Explore our luxury coastal apartments at Siriba Resort, Watamu.",
};

export default async function AccommodationPage() {
  const [apartments, settings] = await Promise.all([getActiveApartments(), getSiteSettings()]);

  return (
    <>
      <PageHero title="Our Apartments" image="/images/hero-1.png" />

      <section className="mx-auto max-w-7xl px-6 py-20">
        {apartments.length === 0 ? (
          <p className="text-center text-ink-muted">
            No apartments are listed yet — check back soon.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {apartments.map((apartment) => (
              <ApartmentCard
                key={apartment.id}
                apartment={apartment}
                showPrices={settings.show_prices}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

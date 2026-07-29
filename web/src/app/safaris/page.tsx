import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SafariCard from "@/components/SafariCard";
import { getActiveSafaris } from "@/lib/safaris";

export const metadata: Metadata = {
  title: "Safaris",
  description: "Explore Kenya's game parks with a safari package arranged through Siriba Resort.",
};

export default async function SafarisPage() {
  const safaris = await getActiveSafaris();

  return (
    <>
      <PageHero title="Safaris & Excursions" image="/images/hero-3.png" />

      <section className="mx-auto max-w-7xl px-6 py-20">
        {safaris.length === 0 ? (
          <p className="text-center text-ink-muted">
            No safari packages are listed yet — check back soon.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {safaris.map((safari) => (
              <SafariCard key={safari.id} safari={safari} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

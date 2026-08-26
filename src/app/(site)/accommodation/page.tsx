import type { Metadata } from "next";
import Link from "next/link";
import { AccommodationCard } from "@/components/site/cards";
import { PageHero } from "@/components/site/page-hero";
import { listApartments } from "@/lib/data/content";
import { getPublicSettings } from "@/lib/data/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Accommodation",
  description:
    "Self-catering apartments, suites and studios at Siriba Resort Watamu — air-conditioned, serviced daily and minutes from the Watamu Marine National Park.",
  alternates: { canonical: "/accommodation" },
};

export default async function AccommodationPage() {
  const [settings, apartments] = await Promise.all([
    getPublicSettings(),
    listApartments(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Where you'll stay"
        title="Accommodation"
        intro="Four self-catering apartments set in a walled garden, each with its own kitchen, air conditioning and a place to sit outside."
        image="https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=2400&q=80"
        imageAlt="Apartment terrace at Siriba Resort Watamu"
        crumbs={[{ href: "/", label: "Home" }, { label: "Accommodation" }]}
        compact
      />

      <section className="section-y bg-sand">
        <div className="shell">
          {apartments.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <p className="max-w-xl rich-text">
                  Rates are per apartment, per night — not per person. Check-in from{" "}
                  {settings.check_in_time ?? "14:00"}, check-out by{" "}
                  {settings.check_out_time ?? "10:00"}.
                </p>
                <p className="shrink-0 text-sm text-ink-muted">
                  {apartments.length}{" "}
                  {apartments.length === 1 ? "property" : "properties"} available
                </p>
              </div>

              <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {apartments.map((apartment, i) => (
                  <AccommodationCard
                    key={apartment.id}
                    apartment={apartment}
                    hidePrices={settings.hide_prices}
                    priority={i < 3}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

function EmptyState() {
  return (
    <div className="panel mx-auto max-w-lg px-8 py-14 text-center">
      <h2 className="font-display text-xl font-semibold">
        Our apartments are being updated
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        Nothing is published just now. Get in touch and we will tell you what is free
        for your dates.
      </p>
      <Link href="/contact" className="btn btn-primary mt-7">
        Contact Us
      </Link>
    </div>
  );
}

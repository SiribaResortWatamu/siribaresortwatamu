import type { Metadata } from "next";
import Link from "next/link";
import { AmenityIcon } from "@/components/site/amenity-icon";
import { PageHero } from "@/components/site/page-hero";
import { listAmenities } from "@/lib/data/content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Amenities",
  description:
    "Pool, beach access, fibre Wi-Fi, air conditioning, fitted kitchens, secure parking and 24-hour security at Siriba Resort Watamu.",
  alternates: { canonical: "/amenities" },
};

export default async function AmenitiesPage() {
  const amenities = await listAmenities();
  const featured = amenities.filter((a) => a.is_featured);
  const rest = amenities.filter((a) => !a.is_featured);

  return (
    <>
      <PageHero
        eyebrow="What's here"
        title="Amenities"
        intro="The things that make a self-catering stay work properly — and a few that simply make it nicer."
        image="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=2400&q=80"
        imageAlt="Pool at Siriba Resort Watamu"
        crumbs={[{ href: "/", label: "Home" }, { label: "Amenities" }]}
        compact
      />

      <section className="section-y bg-sand">
        <div className="shell">
          {amenities.length === 0 ? (
            <p className="rich-text mx-auto max-w-lg text-center">
              Our amenity list is being updated. Get in touch and we will tell you
              exactly what is available.
            </p>
          ) : (
            <>
              {featured.length > 0 && (
                <>
                  <div className="max-w-2xl">
                    <p className="eyebrow">Included in every stay</p>
                    <h2 className="display-lg mt-3">The essentials</h2>
                  </div>

                  <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {featured.map((amenity) => (
                      <div key={amenity.id} className="panel flex gap-5 p-7">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ocean-soft text-ocean">
                          <AmenityIcon name={amenity.icon} size={22} />
                        </span>
                        <div>
                          <h3 className="font-display text-lg font-semibold">
                            {amenity.name}
                          </h3>
                          {amenity.description && (
                            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                              {amenity.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {rest.length > 0 && (
                <div className={featured.length > 0 ? "mt-20" : ""}>
                  <div className="max-w-2xl">
                    <p className="eyebrow">Also available</p>
                    <h2 className="display-lg mt-3">On request</h2>
                  </div>

                  <ul className="mt-10 grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                    {rest.map((amenity) => (
                      <li key={amenity.id} className="flex items-start gap-3.5">
                        <AmenityIcon
                          name={amenity.icon}
                          size={19}
                          className="mt-0.5 shrink-0 text-terracotta"
                        />
                        <div>
                          <p className="text-[0.95rem]">{amenity.name}</p>
                          {amenity.description && (
                            <p className="mt-0.5 text-sm text-ink-muted">
                              {amenity.description}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <div className="mt-20 rounded-3xl bg-ocean px-8 py-14 text-center text-white">
            <h2 className="display-md text-white">Need something we haven&apos;t listed?</h2>
            <p className="mx-auto mt-4 max-w-lg text-white/75">
              A cot, an airport pick-up at midnight, a chef for the evening, a
              wheelchair-accessible room — ask us. Most things can be arranged.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/contact" className="btn btn-primary">
                Ask a Question
              </Link>
              <Link href="/accommodation" className="btn btn-on-dark">
                View Accommodation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

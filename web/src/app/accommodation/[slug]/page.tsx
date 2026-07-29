import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import * as FaIcons from "react-icons/fa6";
import type { IconType } from "react-icons";
import PageHero from "@/components/PageHero";
import ApartmentCard from "@/components/ApartmentCard";
import {
  getApartmentBySlug,
  getRelatedApartments,
  galleryImages,
} from "@/lib/apartments";

type Params = Promise<{ slug: string }>;

// The old site stored plain Font Awesome class suffixes ("fa-bed"); map the
// handful actually used in the seeded apartment data to react-icons/fa6
// equivalents, falling back to a generic dot if a future admin-entered icon
// isn't in the map (rather than crashing the page).
const ICON_MAP: Record<string, IconType> = {
  "fa-bed": FaIcons.FaBed,
  "fa-bath": FaIcons.FaBath,
  "fa-kitchen-set": FaIcons.FaKitchenSet,
  "fa-umbrella-beach": FaIcons.FaUmbrellaBeach,
  "fa-wifi": FaIcons.FaWifi,
  "fa-tv": FaIcons.FaTv,
  "fa-wind": FaIcons.FaWind,
  "fa-sink": FaIcons.FaSink,
  "fa-couch": FaIcons.FaCouch,
  "fa-star": FaIcons.FaStar,
  "fa-gem": FaIcons.FaGem,
  "fa-water": FaIcons.FaWater,
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const apartment = await getApartmentBySlug(slug);
  if (!apartment) return { title: "Apartment Not Found" };
  return { title: apartment.name, description: apartment.description };
}

export default async function RoomDetailsPage({ params }: { params: Params }) {
  const { slug } = await params;
  const apartment = await getApartmentBySlug(slug);
  if (!apartment) notFound();

  const images = galleryImages(apartment);
  const related = await getRelatedApartments(slug, 3);

  return (
    <>
      <PageHero title={apartment.name} image={images[0]} />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {images.length > 1 && (
              <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((src, i) => (
                  <div key={src + i} className="relative h-32 overflow-hidden rounded-xl sm:h-40">
                    <Image src={src} alt={`${apartment.name} photo ${i + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}

            <h2 className="font-display text-3xl text-ink">About this apartment</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">{apartment.description}</p>

            <h3 className="mt-10 font-display text-2xl text-ink">Amenities</h3>
            <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {apartment.features.map((feature) => {
                const Icon = ICON_MAP[feature.icon] ?? FaIcons.FaCircle;
                return (
                  <li
                    key={feature.text}
                    className="flex items-center gap-3 border-b border-hairline pb-3 text-ink-muted"
                  >
                    <Icon className="text-ocean" />
                    {feature.text}
                  </li>
                );
              })}
            </ul>
          </div>

          <aside className="h-fit rounded-2xl border border-hairline bg-white p-8 shadow-sm" id="book">
            <div className="text-ink-muted">
              From{" "}
              <span className="font-display text-3xl text-terracotta">${apartment.price_usd}</span>{" "}
              / night
            </div>
            <p className="mt-4 text-sm text-ink-muted">
              {apartment.guests} guests &middot; {apartment.bedrooms} bedrooms &middot;{" "}
              {apartment.bathrooms} bathrooms
            </p>
            <p className="mt-6 rounded-xl bg-sand p-4 text-sm text-ink-muted">
              Online booking with live availability is coming in the next build phase. For now,
              reach out directly to reserve this apartment.
            </p>
            <Link
              href="/contact"
              className="mt-6 block rounded-full bg-terracotta px-6 py-3 text-center font-medium text-white transition-colors hover:bg-terracotta-hover"
            >
              Enquire to Book
            </Link>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-sand py-20">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-10 text-center font-display text-3xl text-ink">
              Other Apartments You Might Like
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <ApartmentCard key={r.id} apartment={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

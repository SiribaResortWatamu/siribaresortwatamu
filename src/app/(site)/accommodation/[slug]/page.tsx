import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Bath,
  BedDouble,
  Building2,
  Check,
  Clock,
  MapPin,
  Moon,
  Users,
} from "lucide-react";
import { AmenityIcon } from "@/components/site/amenity-icon";
import { BookingWidget } from "@/components/site/booking-widget";
import { Gallery } from "@/components/site/gallery";
import { PageHero } from "@/components/site/page-hero";
import { Rule } from "@/components/site/section";
import {
  amenitiesByIds,
  getApartment,
  getUnavailableDates,
} from "@/lib/data/content";
import { getPublicSettings } from "@/lib/data/settings";
import { coverAlt, coverImage } from "@/lib/images";
import { paragraphs } from "@/lib/utils";
import { siteUrl } from "@/lib/env";

// Availability has to be current, so this page is rendered per request
// rather than cached. It is still fully server-rendered for search engines.
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const apartment = await getApartment(slug);
  if (!apartment) return { title: "Not found" };

  const image = coverImage(apartment.apartment_photos);
  const description =
    apartment.seo_description ?? apartment.short_description ?? undefined;

  return {
    // A custom SEO title is used exactly as written. The bare name still
    // picks up the "— Siriba Resort Watamu" suffix from the root template,
    // so a title that already contains it is not repeated.
    title: apartment.seo_title ? { absolute: apartment.seo_title } : apartment.name,
    description,
    alternates: { canonical: `/accommodation/${apartment.slug}` },
    openGraph: {
      title: apartment.seo_title ?? apartment.name,
      description,
      url: `${siteUrl()}/accommodation/${apartment.slug}`,
      images: image ? [{ url: image }] : undefined,
      type: "website",
    },
  };
}

export default async function AccommodationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const apartment = await getApartment(slug);
  if (!apartment) notFound();

  const [settings, amenities, unavailableDates] = await Promise.all([
    getPublicSettings(),
    amenitiesByIds(apartment.amenity_ids),
    getUnavailableDates(apartment.id),
  ]);

  const description = paragraphs(apartment.full_description);
  const gallery = apartment.apartment_photos ?? [];

  const facts = [
    { icon: Users, label: "Guests", value: `Up to ${apartment.max_guests}` },
    {
      icon: BedDouble,
      label: "Bedrooms",
      value: String(apartment.bedrooms),
    },
    { icon: Bath, label: "Bathrooms", value: String(apartment.bathrooms) },
    { icon: Moon, label: "Beds", value: String(apartment.beds) },
    { icon: Building2, label: "Property type", value: apartment.property_type },
  ];

  return (
    <>
      <PageHero
        eyebrow={apartment.property_type}
        title={apartment.name}
        intro={apartment.short_description ?? undefined}
        image={coverImage(apartment.apartment_photos)}
        imageAlt={coverAlt(apartment.apartment_photos, apartment.name)}
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/accommodation", label: "Accommodation" },
          { label: apartment.name },
        ]}
      >
        {apartment.location && (
          <p className="inline-flex items-center gap-2 text-sm text-white/80">
            <MapPin size={15} strokeWidth={1.6} className="text-terracotta" />
            {apartment.location}
          </p>
        )}
      </PageHero>

      {/* Quick facts ---------------------------------------------------- */}
      <section className="border-b border-line bg-sand-deep">
        <div className="shell">
          <dl className="grid grid-cols-2 divide-line sm:grid-cols-3 lg:grid-cols-5 lg:divide-x">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3.5 px-1 py-6 lg:px-6">
                <Icon size={20} strokeWidth={1.4} className="shrink-0 text-ocean" />
                <div>
                  <dt className="text-[0.65rem] tracking-[0.12em] text-ink-muted uppercase">
                    {label}
                  </dt>
                  <dd className="mt-0.5 font-display text-base font-semibold">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="section-y bg-sand">
        <div className="shell grid gap-14 lg:grid-cols-[1fr_23rem] lg:gap-16 xl:gap-20">
          {/* Main column ---------------------------------------------- */}
          <div className="min-w-0">
            {gallery.length > 0 && (
              <section>
                <h2 className="sr-only">Photos of {apartment.name}</h2>
                <Gallery photos={gallery} title={apartment.name} />
              </section>
            )}

            {description.length > 0 && (
              <section className={gallery.length > 0 ? "mt-16" : ""}>
                <p className="eyebrow">About this apartment</p>
                <h2 className="display-md mt-3">{apartment.name}</h2>
                <Rule className="mt-6" />
                <div className="rich-text mt-7">
                  {description.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </section>
            )}

            {amenities.length > 0 && (
              <section className="mt-16">
                <p className="eyebrow">What&apos;s included</p>
                <h2 className="display-md mt-3">Amenities</h2>
                <Rule className="mt-6" />

                <div className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  {amenities.map((amenity) => (
                    <div key={amenity.id} className="flex items-start gap-3.5">
                      <AmenityIcon
                        name={amenity.icon}
                        size={19}
                        className="mt-0.5 shrink-0 text-ocean"
                      />
                      <div>
                        <p className="text-[0.95rem] font-normal">{amenity.name}</p>
                        {amenity.description && (
                          <p className="mt-0.5 text-sm text-ink-muted">
                            {amenity.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Good to know ------------------------------------------- */}
            <section className="mt-16">
              <p className="eyebrow">Good to know</p>
              <h2 className="display-md mt-3">House rules and policies</h2>
              <Rule className="mt-6" />

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <InfoCard
                  icon={<Clock size={18} strokeWidth={1.4} />}
                  title="Check-in & check-out"
                  lines={[
                    `Arrive any time from ${settings.check_in_time ?? "14:00"}`,
                    `Please vacate by ${settings.check_out_time ?? "10:00"}`,
                    apartment.min_nights > 1
                      ? `Minimum stay of ${apartment.min_nights} nights`
                      : "No minimum stay",
                  ]}
                />
                <InfoCard
                  icon={<Check size={18} strokeWidth={1.4} />}
                  title="Booking & cancellation"
                  lines={[
                    settings.booking_terms ??
                      "A deposit confirms your dates; the balance is settled on arrival.",
                    settings.cancellation_policy ??
                      "Free cancellation up to 14 days before arrival.",
                  ]}
                />
              </div>
            </section>

            <div className="mt-14 border-t border-line pt-8">
              <Link
                href="/accommodation"
                className="text-sm font-medium text-ocean transition-colors hover:text-ocean-dark"
              >
                ← Back to all accommodation
              </Link>
            </div>
          </div>

          {/* Booking column -------------------------------------------- */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <BookingWidget
              apartment={apartment}
              unavailableDates={unavailableDates}
              hidePrices={settings.hide_prices}
              whatsapp={settings.whatsapp}
              checkInTime={settings.check_in_time}
              checkOutTime={settings.check_out_time}
            />
          </aside>
        </div>
      </div>
    </>
  );
}

function InfoCard({
  icon,
  title,
  lines,
}: {
  icon: React.ReactNode;
  title: string;
  lines: string[];
}) {
  return (
    <div className="panel p-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ocean-soft text-ocean">
        {icon}
      </span>
      <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-muted">
        {lines.filter(Boolean).map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

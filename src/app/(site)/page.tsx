import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarCheck, Compass, Car, MapPin, ShieldCheck, Waves } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { AccommodationCard, SafariCard, TransferCard } from "@/components/site/cards";
import { AmenityIcon } from "@/components/site/amenity-icon";
import { SectionHeading, Rule } from "@/components/site/section";
import {
  listAmenities,
  listApartments,
  listSafaris,
  listTransfers,
} from "@/lib/data/content";
import { getPublicSettings } from "@/lib/data/settings";
import { whatsappLink } from "@/lib/whatsapp";

export const revalidate = 300;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2400&q=80";

const REASONS = [
  {
    icon: Waves,
    title: "Five minutes from the sand",
    body: "The Watamu Marine National Park is a short, shaded walk from the gate — one of the finest stretches of reef on the Kenyan coast.",
  },
  {
    icon: BadgeCheck,
    title: "Book direct, pay less",
    body: "No platform commission and no booking fee. You deal with the people who actually run the property, from first enquiry to check-out.",
  },
  {
    icon: Compass,
    title: "Safaris arranged in-house",
    body: "Tsavo in two days, the Mara in three. We run our own safari desk, so your beach days and bush days are planned together.",
  },
  {
    icon: Car,
    title: "Your own driver on call",
    body: "Airport, SGR and hotel transfers in vetted vehicles with drivers we know, at fixed prices agreed before you travel.",
  },
  {
    icon: ShieldCheck,
    title: "Secure and staffed",
    body: "A manned gate day and night, off-street parking and a backup generator, so the power cuts are somebody else's problem.",
  },
  {
    icon: CalendarCheck,
    title: "Straight answers, quickly",
    body: "Every enquiry reaches a real person. Most are answered the same day, in English or Kiswahili, by WhatsApp or email.",
  },
];

export default async function HomePage() {
  const [settings, apartments, safaris, transfers, amenities] = await Promise.all([
    getPublicSettings(),
    listApartments(),
    listSafaris(),
    listTransfers(),
    listAmenities(),
  ]);

  const featuredApartments = pickFeatured(apartments, 3);
  const featuredSafaris = pickFeatured(safaris, 3);
  const featuredTransfers = pickFeatured(transfers, 3);
  const featuredAmenities = amenities.filter((a) => a.is_featured).slice(0, 8);
  const wa = whatsappLink(
    settings.whatsapp,
    "Hello! I'd like to enquire about staying at Siriba Resort Watamu.",
  );

  return (
    <>
      {/* ---------------------------------------------------------------
          1. Hero
          --------------------------------------------------------------- */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-ink">
        <Image
          src={HERO_IMAGE}
          alt="The Indian Ocean at Watamu on the Kenyan coast"
          fill
          priority
          sizes="100vw"
          className="animate-slow-zoom object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/65 via-ink/45 to-ink/75" />

        <div className="shell relative z-10 py-32 text-center">
          <p className="animate-rise text-[0.7rem] font-medium tracking-[0.3em] text-white/80 uppercase">
            {settings.address ?? "Watamu · Kenya"}
          </p>

          <h1
            className="animate-rise display-xl mt-6 text-balance text-white"
            style={{ animationDelay: "80ms" }}
          >
            {settings.tagline ?? "Your Coastal Escape Starts Here"}
          </h1>

          <p
            className="animate-rise mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/85"
            style={{ animationDelay: "160ms" }}
          >
            Self-catering apartments a few minutes from the Watamu Marine National
            Park, with safaris inland and private transfers along the coast — all
            arranged by the people who live here.
          </p>

          <div
            className="animate-rise mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: "240ms" }}
          >
            <Link href="/accommodation" className="btn btn-primary w-full sm:w-auto">
              Book Your Stay
            </Link>
            <Link href="/safaris" className="btn btn-on-dark w-full sm:w-auto">
              Explore Our Experiences
            </Link>
            <Link href="/transfers" className="btn btn-on-dark w-full sm:w-auto">
              Book a Transfer
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 md:block">
          <span className="block h-12 w-px animate-pulse bg-white/40" />
        </div>
      </section>

      {/* ---------------------------------------------------------------
          2. Introduction
          --------------------------------------------------------------- */}
      <section className="section-y bg-sand">
        <div className="shell grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="eyebrow">Welcome to {settings.property_name}</p>
            <h2 className="display-lg mt-4 text-balance">
              A quiet corner of the Kenyan coast, run by hand
            </h2>
            <Rule className="mt-7" />
            <div className="rich-text mt-7 space-y-5">
              <p>
                Siriba is a small collection of self-catering apartments set in a
                walled tropical garden in Watamu, between the creek and the reef. There
                are four of them, not forty — which is the point.
              </p>
              <p>
                You get a kitchen you can actually cook in, a pool that is never
                crowded, and a gate that someone is always watching. What you do with
                the days is up to you: the marine park is minutes away, Tsavo is a
                morning&apos;s drive, and we can put a driver at your door for either.
              </p>
            </div>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/about" className="btn btn-outline">
                Our Story
              </Link>
              <Link href="/amenities" className="btn btn-outline">
                What&apos;s Included
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            <div className="relative col-span-1 aspect-[3/4] overflow-hidden rounded-2xl">
              <Image
                src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=80"
                alt="Pool and garden at the resort"
                fill
                sizes="(min-width: 1024px) 25vw, 45vw"
                className="object-cover"
              />
            </div>
            <div className="mt-10 grid gap-4 sm:gap-5">
              <div className="relative aspect-square overflow-hidden rounded-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80"
                  alt="Watamu beach"
                  fill
                  sizes="(min-width: 1024px) 25vw, 45vw"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80"
                  alt="Apartment interior"
                  fill
                  sizes="(min-width: 1024px) 25vw, 45vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          3. Featured accommodation
          --------------------------------------------------------------- */}
      {featuredApartments.length > 0 && (
        <section className="section-y bg-sand-deep">
          <div className="shell">
            <SectionHeading
              eyebrow="Where you'll stay"
              title="Apartments and suites"
              intro="Each one is self-catering, air-conditioned and serviced every morning. Rates are per apartment, not per person."
              action={{ href: "/accommodation", label: "All accommodation" }}
            />

            <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {featuredApartments.map((apartment, i) => (
                <AccommodationCard
                  key={apartment.id}
                  apartment={apartment}
                  hidePrices={settings.hide_prices}
                  priority={i === 0}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------
          4. Why stay with us
          --------------------------------------------------------------- */}
      <section className="section-y bg-sand">
        <div className="shell">
          <SectionHeading
            eyebrow="Why stay with us"
            title="Small enough to notice you"
            align="center"
          />

          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {REASONS.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ocean-soft text-ocean">
                  <Icon size={21} strokeWidth={1.4} />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          5. Amenities
          --------------------------------------------------------------- */}
      {featuredAmenities.length > 0 && (
        <section className="section-y bg-ocean text-white">
          <div className="shell">
            <div className="max-w-2xl">
              <p className="text-[0.7rem] font-medium tracking-[0.18em] text-white/60 uppercase">
                Included in every stay
              </p>
              <h2 className="display-lg mt-3 text-white">
                The things you shouldn&apos;t have to ask for
              </h2>
            </div>

            <div className="mt-14 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
              {featuredAmenities.map((amenity) => (
                <div key={amenity.id} className="flex gap-4">
                  <AmenityIcon
                    name={amenity.icon}
                    size={22}
                    className="mt-0.5 shrink-0 text-white/70"
                  />
                  <div>
                    <p className="font-medium">{amenity.name}</p>
                    {amenity.description && (
                      <p className="mt-1 text-sm text-white/60">{amenity.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/amenities"
              className="group mt-14 inline-flex items-center gap-2 text-sm font-medium text-white"
            >
              See everything we offer
              <ArrowRight
                size={16}
                strokeWidth={1.75}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------
          6. Featured safaris
          --------------------------------------------------------------- */}
      {featuredSafaris.length > 0 && (
        <section className="section-y bg-sand">
          <div className="shell">
            <SectionHeading
              eyebrow="Beyond the beach"
              title="Safaris from the coast"
              intro="Tsavo is close enough for a two-day trip. The Mara is a short flight away. Both are arranged from our own safari desk."
              action={{ href: "/safaris", label: "All safaris" }}
            />

            <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {featuredSafaris.map((safari) => (
                <SafariCard
                  key={safari.id}
                  safari={safari}
                  hidePrices={settings.hide_prices}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------
          7. Transfers
          --------------------------------------------------------------- */}
      {featuredTransfers.length > 0 && (
        <section className="section-y bg-sand-deep">
          <div className="shell">
            <SectionHeading
              eyebrow="Getting around"
              title="Transfers and private drivers"
              intro="Fixed prices, vetted drivers and air-conditioned vehicles — from a five-minute run into Watamu village to the airport at Mombasa."
              action={{ href: "/transfers", label: "All transfer services" }}
            />

            <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {featuredTransfers.map((transfer) => (
                <TransferCard
                  key={transfer.id}
                  transfer={transfer}
                  hidePrices={settings.hide_prices}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------
          8. Location
          --------------------------------------------------------------- */}
      <section className="section-y bg-sand">
        <div className="shell grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image
              src="https://images.unsplash.com/photo-1589979481223-deb893043163?w=1600&q=80"
              alt="Mida Creek near Watamu"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          <div>
            <p className="eyebrow">The destination</p>
            <h2 className="display-lg mt-4 text-balance">Watamu, Kilifi County</h2>
            <Rule className="mt-7" />

            <div className="rich-text mt-7 space-y-5">
              <p>
                Watamu sits on a stretch of coast where the reef comes close enough to
                swim to. The marine national park was one of the first in Africa, and
                between the coral gardens, the turtles and Mida Creek behind the town,
                there is a great deal to do without ever getting in a car.
              </p>
              <p>
                When you do, the Gede Ruins are ten minutes inland, Malindi is half an
                hour up the road, and Tsavo East is close enough to reach before the
                morning game drive is over.
              </p>
            </div>

            <dl className="mt-9 grid grid-cols-2 gap-6 border-t border-line pt-8">
              <Distance label="Malindi Airport" value="40 minutes" />
              <Distance label="Mombasa Airport" value="2 hours" />
              <Distance label="Marine park gate" value="5 minutes" />
              <Distance label="Gede Ruins" value="10 minutes" />
            </dl>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          9 + 10. Direct booking and contact
          --------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=2400&q=80"
          alt="Sunset over the Indian Ocean"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/72" />

        <div className="shell-narrow relative z-10 py-24 text-center md:py-32">
          <MapPin size={26} strokeWidth={1.3} className="mx-auto text-terracotta" />
          <h2 className="display-lg mt-6 text-balance text-white">
            Book direct and keep the difference
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-white/80">
            No commission, no booking fee and no call centre. Send us your dates and
            we will confirm availability, usually within a few hours.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/accommodation" className="btn btn-primary w-full sm:w-auto">
              Check Availability
            </Link>
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-on-dark w-full sm:w-auto"
              >
                <WhatsAppIcon size={16} />
                WhatsApp Us
              </a>
            ) : (
              <Link href="/contact" className="btn btn-on-dark w-full sm:w-auto">
                Contact Us
              </Link>
            )}
          </div>

          {settings.phone && (
            <p className="mt-9 text-sm text-white/55">
              Or call us on{" "}
              <a href={`tel:${settings.phone}`} className="text-white underline-offset-4 hover:underline">
                {settings.phone}
              </a>
            </p>
          )}
        </div>
      </section>
    </>
  );
}

function Distance({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs tracking-[0.12em] text-ink-muted uppercase">{label}</dt>
      <dd className="mt-1 font-display text-xl font-semibold text-ocean">{value}</dd>
    </div>
  );
}

/** Featured records first, then whatever else fills the row. */
function pickFeatured<T extends { is_featured: boolean }>(items: T[], count: number): T[] {
  const featured = items.filter((i) => i.is_featured);
  const rest = items.filter((i) => !i.is_featured);
  return [...featured, ...rest].slice(0, count);
}

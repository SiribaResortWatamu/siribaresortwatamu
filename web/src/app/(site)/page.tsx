import Image from "next/image";
import Link from "next/link";
import ApartmentCard from "@/components/ApartmentCard";
import { getFeaturedApartments } from "@/lib/apartments";
import { getSiteSettings } from "@/lib/site-settings";

export default async function HomePage() {
  const [featured, settings] = await Promise.all([getFeaturedApartments(3), getSiteSettings()]);

  return (
    <>
      <section className="relative flex h-screen min-h-[600px] items-center justify-center bg-cover bg-center">
        <Image
          src="/images/hero.png"
          alt="Siriba Resort Watamu"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-ink/40" />
        <div className="relative px-6 text-center text-white">
          <p className="mb-4 text-sm uppercase tracking-[0.4em] text-white/80">
            Watamu, Kenya
          </p>
          <h1 className="font-display text-5xl font-semibold leading-tight md:text-7xl">
            Your Coastal
            <br />
            Holiday Home
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/85">
            Luxury apartments steps from the Indian Ocean at Neverland Junction, Jacaranda
            Road, Watamu.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/accommodation"
              className="rounded-full bg-terracotta px-8 py-3.5 font-medium text-white transition-colors hover:bg-terracotta-hover"
            >
              View Apartments
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-white/60 px-8 py-3.5 font-medium text-white transition-colors hover:bg-white/10"
            >
              Our Story
            </Link>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <h2 className="font-display text-3xl font-medium text-ink md:text-4xl">
                Our Favorite Stays
              </h2>
              <p className="mt-4 text-ink-muted">
                A closer look at some of our most-loved apartments.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((apartment) => (
                <ApartmentCard key={apartment.id} apartment={apartment} showPrices={settings.show_prices} />
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link
                href="/accommodation"
                className="inline-block rounded-full border border-terracotta px-8 py-3 font-medium text-terracotta transition-colors hover:bg-terracotta hover:text-white"
              >
                View All Apartments
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

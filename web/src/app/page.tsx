import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
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

      <section className="bg-white py-20 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="font-display text-3xl font-medium text-ink md:text-4xl">
            Rebuilding, Room by Room
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-muted">
            This is the new Siriba Resort site taking shape — the coastal design system is
            live on this page and the{" "}
            <Link href="/about" className="text-ocean underline underline-offset-4">
              About
            </Link>{" "}
            and{" "}
            <Link href="/amenities" className="text-ocean underline underline-offset-4">
              Amenities
            </Link>{" "}
            pages. Apartment listings, live availability, and bookings connect once the data
            layer is wired up.
          </p>
        </div>
      </section>
    </>
  );
}

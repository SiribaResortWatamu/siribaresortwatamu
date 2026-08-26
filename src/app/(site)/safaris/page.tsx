import type { Metadata } from "next";
import Link from "next/link";
import { SafariCard } from "@/components/site/cards";
import { PageHero } from "@/components/site/page-hero";
import { listSafaris } from "@/lib/data/content";
import { getPublicSettings } from "@/lib/data/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Safaris",
  description:
    "Safaris from the Kenyan coast — Tsavo East in two days, a fly-in to the Masai Mara, and day trips to the Gede Ruins and Mida Creek.",
  alternates: { canonical: "/safaris" },
};

export default async function SafarisPage() {
  const [settings, safaris] = await Promise.all([getPublicSettings(), listSafaris()]);

  return (
    <>
      <PageHero
        eyebrow="Beyond the beach"
        title="Safaris & Experiences"
        intro="Tsavo is close enough for two days. The Mara is a short flight. Everything here is arranged from our own safari desk, with drivers and guides we work with all year."
        image="https://images.unsplash.com/photo-1516426122078-c23e76319801?w=2400&q=80"
        imageAlt="Elephants in Tsavo, Kenya"
        crumbs={[{ href: "/", label: "Home" }, { label: "Safaris" }]}
        compact
      />

      <section className="section-y bg-sand">
        <div className="shell">
          {safaris.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <p className="max-w-2xl rich-text">
                Prices are per person sharing and include park fees, transport and
                accommodation unless stated otherwise. Send an enquiry with your dates
                and we will confirm availability and a full quote.
              </p>

              <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {safaris.map((safari, i) => (
                  <SafariCard
                    key={safari.id}
                    safari={safari}
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
      <h2 className="font-display text-xl font-semibold">Safari packages coming soon</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        We are updating our itineraries. Tell us where you would like to go and we will
        build something for you.
      </p>
      <Link href="/contact" className="btn btn-primary mt-7">
        Contact Us
      </Link>
    </div>
  );
}

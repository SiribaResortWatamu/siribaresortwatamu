import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Clock3, ShieldCheck, Wallet } from "lucide-react";
import { TransferCard } from "@/components/site/cards";
import { PageHero } from "@/components/site/page-hero";
import { listTransfers } from "@/lib/data/content";
import { getPublicSettings } from "@/lib/data/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Transfers & Taxi",
  description:
    "Private transfers and taxi services in Watamu — Malindi and Mombasa airports, the SGR terminus, local runs and full-day private drivers at fixed prices.",
  alternates: { canonical: "/transfers" },
};

const PROMISES = [
  {
    icon: Wallet,
    title: "Fixed prices",
    body: "Agreed before you travel. Nothing to negotiate at the roadside.",
  },
  {
    icon: BadgeCheck,
    title: "Drivers we know",
    body: "Vetted, licensed and working with us all year — not a random pick-up.",
  },
  {
    icon: Clock3,
    title: "Flights tracked",
    body: "A late flight or train costs you nothing. We wait.",
  },
  {
    icon: ShieldCheck,
    title: "Proper vehicles",
    body: "Air-conditioned, insured and serviced, with room for your luggage.",
  },
];

export default async function TransfersPage() {
  const [settings, transfers] = await Promise.all([
    getPublicSettings(),
    listTransfers(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Getting around"
        title="Transfers & Private Drivers"
        intro="Convenient private transport across the Kenyan coast — from a five-minute run into Watamu village to the airport at Mombasa, in vehicles and with drivers we know personally."
        image="/transfers-hero.jpg"
        imageAlt="An illuminated taxi sign at night"
        scrim="soft"
        crumbs={[{ href: "/", label: "Home" }, { label: "Transfers" }]}
        compact
      />

      {/* Promises ------------------------------------------------------- */}
      <section className="border-b border-line bg-sand-deep">
        <div className="shell grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <Icon size={22} strokeWidth={1.4} className="mt-0.5 shrink-0 text-ocean" />
              <div>
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-y bg-sand">
        <div className="shell">
          {transfers.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="max-w-2xl">
                <p className="eyebrow">Our services</p>
                <h2 className="display-lg mt-3">Choose your transfer</h2>
                <p className="mt-5 rich-text">
                  Every service below can be booked on its own — you do not have to be
                  staying with us. Tell us the date and we will confirm the driver.
                </p>
              </div>

              <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {transfers.map((transfer, i) => (
                  <TransferCard
                    key={transfer.id}
                    transfer={transfer}
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
      <h2 className="font-display text-xl font-semibold">Transfer services coming soon</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        Tell us where you need to get to and we will arrange a driver and quote you a
        fixed price.
      </p>
      <Link href="/contact" className="btn btn-primary mt-7">
        Contact Us
      </Link>
    </div>
  );
}

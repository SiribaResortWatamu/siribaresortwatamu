import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Car,
  Check,
  CircleDollarSign,
  Clock,
  MapPin,
  Plus,
  Users,
  X,
} from "lucide-react";
import { Gallery } from "@/components/site/gallery";
import { PageHero } from "@/components/site/page-hero";
import { Price } from "@/components/site/price";
import { Rule } from "@/components/site/section";
import { TransferBookingForm } from "@/components/site/transfer-booking-form";
import { getTransfer, listTransfers } from "@/lib/data/content";
import { getPublicSettings } from "@/lib/data/settings";
import { coverAlt, coverImage } from "@/lib/images";
import { transferPriceLabel } from "@/lib/pricing";
import { paragraphs } from "@/lib/utils";
import { siteUrl } from "@/lib/env";

export const revalidate = 300;

export async function generateStaticParams() {
  const transfers = await listTransfers();
  return transfers.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const transfer = await getTransfer(slug);
  if (!transfer) return { title: "Not found" };

  const image = coverImage(transfer.transfer_photos);
  const description = transfer.seo_description ?? transfer.short_description ?? undefined;

  return {
    // A custom SEO title is used exactly as written. The bare name still
    // picks up the "— Siriba Resort Watamu" suffix from the root template,
    // so a title that already contains it is not repeated.
    title: transfer.seo_title ? { absolute: transfer.seo_title } : transfer.name,
    description,
    alternates: { canonical: `/transfers/${transfer.slug}` },
    openGraph: {
      title: transfer.seo_title ?? transfer.name,
      description,
      url: `${siteUrl()}/transfers/${transfer.slug}`,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function TransferDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const transfer = await getTransfer(slug);
  if (!transfer) notFound();

  const settings = await getPublicSettings();
  const description = paragraphs(transfer.full_description);
  const onEnquiry = transfer.pricing_method === "on_enquiry";

  const serviceFacts = [
    transfer.vehicle_type && {
      icon: Car,
      label: "Vehicle",
      value: transfer.vehicle_type,
    },
    {
      icon: Users,
      label: "Passengers",
      value: `Up to ${transfer.passenger_capacity}`,
    },
    {
      icon: Briefcase,
      label: "Luggage",
      value: `Up to ${transfer.luggage_capacity} items`,
    },
    transfer.journey_time && {
      icon: Clock,
      label: "Journey time",
      value: transfer.journey_time,
    },
  ].filter(Boolean) as { icon: typeof Car; label: string; value: string }[];

  return (
    <>
      <PageHero
        eyebrow={transfer.service_type}
        title={transfer.name}
        intro={transfer.short_description ?? undefined}
        image={coverImage(transfer.transfer_photos)}
        imageAlt={coverAlt(transfer.transfer_photos, transfer.name)}
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/transfers", label: "Transfers" },
          { label: transfer.name },
        ]}
      />

      {/* Service information strip -------------------------------------- */}
      <section className="border-b border-line bg-sand-deep">
        <div className="shell">
          <dl className="grid grid-cols-2 divide-line lg:grid-cols-4 lg:divide-x">
            {serviceFacts.map(({ icon: Icon, label, value }) => (
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
        <div className="shell grid gap-14 lg:grid-cols-[1fr_24rem] lg:gap-16">
          <div className="min-w-0">
            {transfer.transfer_photos?.length > 1 && (
              <Gallery photos={transfer.transfer_photos} title={transfer.name} />
            )}

            {description.length > 0 && (
              <section className={transfer.transfer_photos?.length > 1 ? "mt-16" : ""}>
                <p className="eyebrow">About this service</p>
                <h2 className="display-md mt-3">{transfer.name}</h2>
                <Rule className="mt-6" />
                <div className="rich-text mt-7">
                  {description.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </section>
            )}

            {/* Routes --------------------------------------------------- */}
            {(transfer.pickup_locations.length > 0 ||
              transfer.dropoff_locations.length > 0) && (
              <section className="mt-16">
                <p className="eyebrow">Where we go</p>
                <h2 className="display-md mt-3">Pick-up and drop-off</h2>
                <Rule className="mt-6" />

                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  {transfer.pickup_locations.length > 0 && (
                    <LocationCard
                      title="Pick-up locations"
                      items={transfer.pickup_locations}
                    />
                  )}
                  {transfer.dropoff_locations.length > 0 && (
                    <LocationCard
                      title="Drop-off locations"
                      items={transfer.dropoff_locations}
                    />
                  )}
                </div>
              </section>
            )}

            {/* Pricing -------------------------------------------------- */}
            <section className="mt-16">
              <p className="eyebrow">Pricing</p>
              <h2 className="display-md mt-3">What it costs</h2>
              <Rule className="mt-6" />

              <div className="mt-8 rounded-2xl border border-ocean/20 bg-ocean-soft/40 p-7">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CircleDollarSign size={20} strokeWidth={1.4} className="text-ocean" />
                    <span className="text-sm text-ink-muted">
                      {onEnquiry
                        ? "Quoted per journey"
                        : `Charged ${transferPriceLabel(transfer.pricing_method)}`}
                    </span>
                  </div>
                  <Price
                    amount={transfer.price}
                    currency={transfer.currency}
                    hidden={settings.hide_prices}
                    onEnquiry={onEnquiry}
                    suffix={transferPriceLabel(transfer.pricing_method)}
                    size="lg"
                  />
                </div>
                {onEnquiry && (
                  <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                    Send us the pick-up point, destination and date, and we will come
                    back with a fixed price for the journey.
                  </p>
                )}
              </div>
            </section>

            {/* Inclusions ------------------------------------------------ */}
            {(transfer.included.length > 0 || transfer.excluded.length > 0) && (
              <section className="mt-10 grid gap-8 sm:grid-cols-2">
                {transfer.included.length > 0 && (
                  <ChecklistCard
                    title="What's included"
                    items={transfer.included}
                    tone="include"
                  />
                )}
                {transfer.excluded.length > 0 && (
                  <ChecklistCard
                    title="Not included"
                    items={transfer.excluded}
                    tone="exclude"
                  />
                )}
              </section>
            )}

            {transfer.additional_charges.length > 0 && (
              <section className="mt-8">
                <ChecklistCard
                  title="Additional charges"
                  items={transfer.additional_charges}
                  tone="extra"
                />
              </section>
            )}

            <div className="mt-14 border-t border-line pt-8">
              <Link
                href="/transfers"
                className="text-sm font-medium text-ocean transition-colors hover:text-ocean-dark"
              >
                ← Back to all transfers
              </Link>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <TransferBookingForm
              service={transfer}
              hidePrices={settings.hide_prices}
              whatsapp={settings.whatsapp}
            />
          </aside>
        </div>
      </div>
    </>
  );
}

function LocationCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="panel p-6">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm">
            <MapPin size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ocean" />
            <span className="text-ink-muted">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChecklistCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "include" | "exclude" | "extra";
}) {
  const Icon = tone === "include" ? Check : tone === "exclude" ? X : Plus;
  const colour =
    tone === "include"
      ? "text-ocean"
      : tone === "exclude"
        ? "text-ink-muted"
        : "text-terracotta";

  return (
    <div className="panel p-7">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-[0.95rem] leading-relaxed">
            <Icon size={16} strokeWidth={1.75} className={`mt-1 shrink-0 ${colour}`} />
            <span className={tone === "exclude" ? "text-ink-muted" : undefined}>
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

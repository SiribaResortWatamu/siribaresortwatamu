import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Clock,
  Info,
  MapPin,
  Plus,
  Sparkles,
  Utensils,
  X,
  BedDouble,
} from "lucide-react";
import { Gallery } from "@/components/site/gallery";
import { PageHero } from "@/components/site/page-hero";
import { Price } from "@/components/site/price";
import { Rule } from "@/components/site/section";
import { SafariEnquiryForm } from "@/components/site/safari-enquiry-form";
import { getSafari, listSafaris } from "@/lib/data/content";
import { getPublicSettings } from "@/lib/data/settings";
import { coverAlt, coverImage } from "@/lib/images";
import { paragraphs } from "@/lib/utils";
import { siteUrl } from "@/lib/env";

export const revalidate = 300;

export async function generateStaticParams() {
  const safaris = await listSafaris();
  return safaris.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const safari = await getSafari(slug);
  if (!safari) return { title: "Not found" };

  const image = coverImage(safari.safari_photos);
  const description = safari.seo_description ?? safari.short_description ?? undefined;

  return {
    // A custom SEO title is used exactly as written. The bare name still
    // picks up the "— Siriba Resort Watamu" suffix from the root template,
    // so a title that already contains it is not repeated.
    title: safari.seo_title ? { absolute: safari.seo_title } : safari.name,
    description,
    alternates: { canonical: `/safaris/${safari.slug}` },
    openGraph: {
      title: safari.seo_title ?? safari.name,
      description,
      url: `${siteUrl()}/safaris/${safari.slug}`,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function SafariDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const safari = await getSafari(slug);
  if (!safari) notFound();

  const settings = await getPublicSettings();
  const overview = paragraphs(safari.full_description);
  const days = safari.safari_itinerary_days ?? [];

  return (
    <>
      <PageHero
        eyebrow={safari.safari_type ?? "Safari"}
        title={safari.name}
        intro={safari.short_description ?? undefined}
        image={coverImage(safari.safari_photos)}
        imageAlt={coverAlt(safari.safari_photos, safari.name)}
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/safaris", label: "Safaris" },
          { label: safari.name },
        ]}
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80">
          {safari.destination && (
            <span className="inline-flex items-center gap-2">
              <MapPin size={15} strokeWidth={1.6} className="text-terracotta" />
              {safari.destination}
            </span>
          )}
          {safari.duration && (
            <span className="inline-flex items-center gap-2">
              <Clock size={15} strokeWidth={1.6} className="text-terracotta" />
              {safari.duration}
            </span>
          )}
        </div>
      </PageHero>

      {/* Summary strip -------------------------------------------------- */}
      <section className="border-b border-line bg-sand-deep">
        <div className="shell flex flex-wrap items-center justify-between gap-6 py-7">
          <dl className="flex flex-wrap gap-x-10 gap-y-4">
            {safari.starting_location && (
              <Meta label="Starts" value={safari.starting_location} />
            )}
            {safari.ending_location && <Meta label="Ends" value={safari.ending_location} />}
            {days.length > 0 && (
              <Meta label="Itinerary" value={`${days.length} days`} />
            )}
          </dl>

          <div className="flex items-center gap-5">
            <Price
              amount={safari.price}
              currency={safari.currency}
              hidden={settings.hide_prices}
              onEnquiry={safari.price_display_mode === "on_enquiry"}
              prefix={safari.price_display_mode === "from_price" ? "from" : undefined}
              suffix="per person"
              size="md"
            />
            <a href="#enquire" className="btn btn-primary btn-sm">
              Enquire
            </a>
          </div>
        </div>
      </section>

      <div className="section-y bg-sand">
        <div className="shell grid gap-14 lg:grid-cols-[1fr_24rem] lg:gap-16">
          <div className="min-w-0">
            {safari.safari_photos?.length > 0 && (
              <Gallery photos={safari.safari_photos} title={safari.name} />
            )}

            {/* Overview -------------------------------------------------- */}
            {overview.length > 0 && (
              <section className={safari.safari_photos?.length ? "mt-16" : ""}>
                <p className="eyebrow">Overview</p>
                <h2 className="display-md mt-3">About this safari</h2>
                <Rule className="mt-6" />
                <div className="rich-text mt-7">
                  {overview.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </section>
            )}

            {/* Highlights ------------------------------------------------ */}
            {safari.highlights.length > 0 && (
              <section className="mt-16">
                <p className="eyebrow">Highlights</p>
                <h2 className="display-md mt-3">What makes this trip</h2>
                <Rule className="mt-6" />

                <ul className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {safari.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Sparkles
                        size={17}
                        strokeWidth={1.4}
                        className="mt-0.5 shrink-0 text-terracotta"
                      />
                      <span className="text-[0.95rem] leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Itinerary ------------------------------------------------- */}
            {days.length > 0 && (
              <section className="mt-16">
                <p className="eyebrow">Day by day</p>
                <h2 className="display-md mt-3">Itinerary</h2>
                <Rule className="mt-6" />

                <ol className="mt-9 space-y-0">
                  {days.map((day, i) => (
                    <li key={day.id} className="relative flex gap-6 pb-10 last:pb-0">
                      {/* Timeline spine */}
                      {i < days.length - 1 && (
                        <span
                          aria-hidden
                          className="absolute top-12 bottom-0 left-[1.375rem] w-px bg-line"
                        />
                      )}

                      <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ocean font-display text-sm font-semibold text-white">
                        {day.day_number}
                      </span>

                      <div className="min-w-0 flex-1 pt-1.5">
                        <p className="text-[0.65rem] tracking-[0.16em] text-terracotta uppercase">
                          Day {day.day_number}
                        </p>
                        <h3 className="mt-1.5 font-display text-lg font-semibold">
                          {day.title}
                        </h3>

                        {day.description && (
                          <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-muted">
                            {day.description}
                          </p>
                        )}

                        {day.activities.length > 0 && (
                          <ul className="mt-4 flex flex-wrap gap-2">
                            {day.activities.map((activity) => (
                              <li
                                key={activity}
                                className="pill bg-ocean-soft text-ocean-dark"
                              >
                                {activity}
                              </li>
                            ))}
                          </ul>
                        )}

                        {(day.accommodation || day.meals) && (
                          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-t border-line pt-4 text-sm">
                            {day.accommodation && (
                              <div className="flex items-center gap-2">
                                <BedDouble
                                  size={15}
                                  strokeWidth={1.4}
                                  className="text-ink-muted"
                                />
                                <dt className="sr-only">Accommodation</dt>
                                <dd className="text-ink-muted">{day.accommodation}</dd>
                              </div>
                            )}
                            {day.meals && (
                              <div className="flex items-center gap-2">
                                <Utensils
                                  size={15}
                                  strokeWidth={1.4}
                                  className="text-ink-muted"
                                />
                                <dt className="sr-only">Meals</dt>
                                <dd className="text-ink-muted">{day.meals}</dd>
                              </div>
                            )}
                          </dl>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Inclusions ------------------------------------------------ */}
            {(safari.included.length > 0 || safari.excluded.length > 0) && (
              <section className="mt-16 grid gap-8 sm:grid-cols-2">
                {safari.included.length > 0 && (
                  <ChecklistCard
                    title="What's included"
                    items={safari.included}
                    tone="include"
                  />
                )}
                {safari.excluded.length > 0 && (
                  <ChecklistCard
                    title="What's excluded"
                    items={safari.excluded}
                    tone="exclude"
                  />
                )}
              </section>
            )}

            {safari.optional_extras.length > 0 && (
              <section className="mt-8">
                <ChecklistCard
                  title="Optional extras"
                  items={safari.optional_extras}
                  tone="extra"
                />
              </section>
            )}

            {safari.important_info && (
              <section className="mt-16">
                <div className="rounded-2xl border border-terracotta/25 bg-terracotta-soft/40 p-7">
                  <div className="flex items-center gap-3">
                    <Info size={19} strokeWidth={1.5} className="text-terracotta" />
                    <h2 className="font-display text-lg font-semibold">
                      Important information
                    </h2>
                  </div>
                  <div className="mt-4 space-y-3 text-[0.95rem] leading-relaxed text-ink-muted">
                    {paragraphs(safari.important_info).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <div className="mt-14 border-t border-line pt-8">
              <Link
                href="/safaris"
                className="text-sm font-medium text-ocean transition-colors hover:text-ocean-dark"
              >
                ← Back to all safaris
              </Link>
            </div>
          </div>

          {/* Enquiry column ---------------------------------------------- */}
          <aside id="enquire" className="scroll-mt-28 lg:sticky lg:top-28 lg:self-start">
            <SafariEnquiryForm safari={safari} whatsapp={settings.whatsapp} />
          </aside>
        </div>
      </div>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.65rem] tracking-[0.12em] text-ink-muted uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
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

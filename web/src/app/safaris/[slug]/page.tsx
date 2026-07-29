import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaCalendarDays } from "react-icons/fa6";
import PageHero from "@/components/PageHero";
import SafariEnquiryWidget from "@/components/SafariEnquiryWidget";
import { getSafariBySlug, safariCoverImage } from "@/lib/safaris";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const safari = await getSafariBySlug(slug);
  if (!safari) return { title: "Safari Not Found" };
  return { title: safari.name, description: safari.description };
}

export default async function SafariDetailsPage({ params }: { params: Params }) {
  const { slug } = await params;
  const safari = await getSafariBySlug(slug);
  if (!safari) notFound();

  return (
    <>
      <PageHero title={safari.name} image={safariCoverImage(safari)} subtitle={safari.duration_label ?? undefined} />

      <section className="mx-auto max-w-4xl px-6 py-16">
        {safari.duration_label && (
          <div className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-ocean">
            <FaCalendarDays /> {safari.duration_label}
          </div>
        )}
        <h2 className="font-display text-3xl text-ink">Overview</h2>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">{safari.description}</p>

        <div className="mt-10 rounded-2xl border border-hairline bg-white p-8 shadow-sm">
          <div className="text-ink-muted">
            {safari.price_usd ? (
              <>
                From{" "}
                <span className="font-display text-3xl text-terracotta">${safari.price_usd}</span>{" "}
                per person
              </>
            ) : (
              <span className="text-lg">Pricing available on enquiry</span>
            )}
          </div>
          <div className="mt-6">
            <SafariEnquiryWidget safariPackageId={safari.id} safariName={safari.name} />
          </div>
        </div>
      </section>
    </>
  );
}

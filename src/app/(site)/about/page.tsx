import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { Rule } from "@/components/site/section";
import { getPublicSettings } from "@/lib/data/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Siriba Resort Watamu is a small, family-run collection of self-catering apartments on the Kenyan coast, with an in-house safari desk and transfer service.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    title: "Owner-run, not managed",
    body: "There is no head office. The people who answer your email are the people who will meet you at the gate, and they live on the property.",
  },
  {
    title: "Local first",
    body: "Our staff, our drivers and our guides are from Watamu and Malindi. What you spend here largely stays here.",
  },
  {
    title: "Honest prices",
    body: "What we quote is what you pay. No resort fees, no service charges added at check-out, no surprises on the last morning.",
  },
  {
    title: "Careful with the coast",
    body: "We are minutes from a marine national park. Reef-safe products, no single-use plastic bottles in the apartments, and water we do not waste.",
  },
];

export default async function AboutPage() {
  const settings = await getPublicSettings();

  return (
    <>
      <PageHero
        eyebrow="Our story"
        title="A small place, run properly"
        intro="Four apartments in a walled garden, a pool under the palms and a gate someone is always watching. That is the whole of it — and it is deliberate."
        image="https://images.unsplash.com/photo-1540541338287-41700207dee6?w=2400&q=80"
        imageAlt="The garden at Siriba Resort Watamu"
        crumbs={[{ href: "/", label: "Home" }, { label: "About" }]}
        compact
      />

      {/* Story ----------------------------------------------------------- */}
      <section className="section-y bg-sand">
        <div className="shell grid items-start gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="eyebrow">Who we are</p>
            <h2 className="display-lg mt-4 text-balance">
              Built for people who want the coast, not a resort complex
            </h2>
            <Rule className="mt-7" />

            <div className="rich-text mt-7 space-y-5">
              <p>
                {settings.property_name} was built as a family house and grew, slowly,
                into four self-catering apartments. It never became a hotel, and we have
                no plans to make it one.
              </p>
              <p>
                What that means in practice: you get a key, a kitchen and a garden, and
                you use them how you like. Nobody puts a towel animal on your bed. If you
                want the pool at six in the morning, it is yours.
              </p>
              <p>
                What it also means is that when something needs fixing, the person who
                fixes it is here — not on a ticket queue in another town. And when you
                want to see Tsavo, or need a car at four in the morning for a flight, we
                arrange it ourselves rather than handing you to an agent.
              </p>
            </div>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/accommodation" className="btn btn-primary">
                See the Apartments
              </Link>
              <Link href="/contact" className="btn btn-outline">
                Get in Touch
              </Link>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl sm:mt-10">
              <Image
                src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80"
                alt="Veranda overlooking the garden"
                fill
                sizes="(min-width: 1024px) 25vw, 45vw"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
              <Image
                src="https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80"
                alt="The beach at Watamu"
                fill
                sizes="(min-width: 1024px) 25vw, 45vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values ---------------------------------------------------------- */}
      <section className="section-y bg-sand-deep">
        <div className="shell">
          <div className="max-w-2xl">
            <p className="eyebrow">How we work</p>
            <h2 className="display-lg mt-3">Four things we hold to</h2>
          </div>

          <div className="mt-14 grid gap-10 sm:grid-cols-2">
            {VALUES.map((value, i) => (
              <div key={value.title} className="flex gap-6">
                <span className="font-display text-3xl font-semibold text-terracotta/40 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold">{value.title}</h3>
                  <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink-muted">
                    {value.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location -------------------------------------------------------- */}
      <section className="section-y bg-sand">
        <div className="shell grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image
              src="https://images.unsplash.com/photo-1589979481223-deb893043163?w=1600&q=80"
              alt="Mida Creek at sunset"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          <div>
            <p className="eyebrow">Where we are</p>
            <h2 className="display-lg mt-4">Watamu, on the north coast</h2>
            <Rule className="mt-7" />

            <div className="rich-text mt-7 space-y-5">
              <p>
                Watamu sits between Malindi and Kilifi, on a stretch of coast protected
                as a marine national park since 1968 — one of the oldest in Africa. The
                reef is close enough to swim to, and the water inside it is calm enough
                for children.
              </p>
              <p>
                Behind the town, Mida Creek fills and empties with the tide through a
                mangrove forest full of birds. Ten minutes inland, the Gede Ruins are what
                is left of a Swahili town that was thriving in the 13th century and
                abandoned by the 17th.
              </p>
            </div>

            {settings.address && (
              <p className="mt-8 border-l-2 border-terracotta pl-5 text-sm text-ink-muted">
                {settings.address}
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

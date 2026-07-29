import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { FaGem, FaLocationDot, FaHeart } from "react-icons/fa6";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn more about Siriba Resort, your luxurious coastal escape at Neverland Junction, Jacaranda Road, Watamu.",
};

const WHY_SIRIBA = [
  {
    icon: FaGem,
    title: "Unmatched Luxury",
    text: "Designed with elegant aesthetics and premium furnishings to ensure you feel pampered.",
  },
  {
    icon: FaLocationDot,
    title: "Prime Location",
    text: "Centrally located on Jacaranda Road, offering easy access to the best Watamu has to offer.",
  },
  {
    icon: FaHeart,
    title: "Personalized Service",
    text: "Our dedicated staff treats every guest like family, catering to your specific needs.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero title="Our Story" image="/images/hero.png" />

      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 md:grid-cols-2 md:items-center">
          <div className="relative h-[360px] overflow-hidden rounded-2xl shadow-xl md:h-[440px]">
            <Image
              src="/images/room.png"
              alt="Siriba Resort Interior"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="font-display text-3xl font-medium text-ink md:text-4xl">
              A Symphony of Lifestyle, Comfort &amp; Convenience
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-muted">
              Nestled in the heart of Watamu at the serene{" "}
              <strong className="text-ink">Neverland Junction on Jacaranda Road</strong>, Siriba
              Resort is more than just a destination — it&apos;s a lifestyle. We have crafted a
              sanctuary where modern luxury meets the authentic, laid-back vibe of the Kenyan
              coast.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">
              Whether you&apos;re seeking a romantic getaway, a family vacation, or a tranquil
              retreat from the bustle of daily life, our resort provides unparalleled comfort.
              With meticulously designed spaces, breathtaking views, and world-class hospitality,
              every moment spent at Siriba is a memory in the making.
            </p>
            <Link
              href="/accommodation"
              className="mt-8 inline-block rounded-full bg-terracotta px-8 py-3 font-medium text-white transition-colors hover:bg-terracotta-hover"
            >
              View Our Rooms
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-sand py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="font-display text-3xl font-medium text-ink md:text-4xl">
            Why Choose Siriba?
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {WHY_SIRIBA.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-hairline bg-white p-10 shadow-sm transition-transform hover:-translate-y-1"
              >
                <Icon className="mx-auto mb-5 text-4xl text-ocean" />
                <h3 className="font-display text-xl text-ink">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

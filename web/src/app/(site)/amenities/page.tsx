import type { Metadata } from "next";
import Image from "next/image";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Amenities",
  description:
    "Discover the world-class amenities at Siriba Resort, including spa, fine dining, fitness, and family events.",
};

const AMENITIES = [
  {
    title: "Cafe and Restaurant",
    image: "/images/dining.png",
    text: "Savor the taste of Kenya and beyond with our curated Cultural Fusion Menu, blending local flavors with international cuisine in a relaxed, elegant dining setting.",
  },
  {
    title: "Swimming Pool",
    image: "/images/hero.png",
    text: "Dive into serenity in our crystal-clear swimming pool — the perfect spot to unwind, soak up the sun, or enjoy a quiet evening swim under the stars.",
  },
  {
    title: "Gym",
    image: "/images/room.png",
    text: "Stay on top of your fitness goals with our fully equipped gym, open around the clock. Personalized training sessions ensure a private and motivating workout experience.",
  },
  {
    title: "Sports & Recreation",
    image: "/images/hero-2.png",
    text: "Keep the energy flowing with our sports facilities, including a basketball court, table tennis, badminton, and a running track.",
  },
  {
    title: "Spa & Massage",
    image: "/images/spa.png",
    text: "Indulge in total relaxation at our world-class spa. Our professional therapists offer a range of rejuvenating treatments designed to refresh your body, calm your mind, and restore your inner balance.",
  },
  {
    title: "Kids' Corner",
    image: "/images/room.png",
    text: "A creative escape for young guests! Kids can paint, play, and snack in a safe, fun environment designed to spark imagination and joy.",
  },
  {
    title: "Event Hosting Spaces",
    image: "/images/dining.png",
    text: "Celebrate life's special moments in our versatile event spaces — ideal for honeymoons, weddings, birthdays, or surprise gatherings.",
  },
];

export default function AmenitiesPage() {
  return (
    <>
      <PageHero title="World-Class Amenities" image="/images/spa.png" />

      <section className="mx-auto flex max-w-6xl flex-col gap-20 px-6 py-20">
        {AMENITIES.map((item, i) => (
          <div
            key={item.title}
            className={`flex flex-col items-center gap-10 md:gap-16 ${
              i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
            }`}
          >
            <div className="relative h-[280px] w-full overflow-hidden rounded-2xl md:h-[360px] md:flex-1">
              <Image
                src={item.image}
                alt={item.title}
                fill
                loading={i === 0 ? "eager" : "lazy"}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="md:flex-1">
              <h2 className="font-display text-3xl font-medium text-ink">
                {item.title}
                <span className="ml-4 inline-block rounded-full bg-ink px-3 py-1 align-middle text-xs font-semibold uppercase tracking-wider text-white/80">
                  Coming Soon
                </span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-ink-muted">{item.text}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

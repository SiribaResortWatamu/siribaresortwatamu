import Image from "next/image";
import Link from "next/link";
import { FaCalendarDays } from "react-icons/fa6";
import { safariCoverImage } from "@/lib/safaris";
import type { SafariPackage } from "@/lib/supabase/types";

export default function SafariCard({ safari }: { safari: SafariPackage }) {
  return (
    <Link
      href={`/safaris/${safari.slug}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-[220px] overflow-hidden">
        <Image
          src={safariCoverImage(safari)}
          alt={safari.name}
          fill
          loading="lazy"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-6">
        {safari.duration_label && (
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ocean">
            <FaCalendarDays /> {safari.duration_label}
          </div>
        )}
        <h3 className="font-display text-xl text-ink">{safari.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{safari.description}</p>
        <div className="mt-4 text-sm font-medium text-terracotta">Explore itinerary &rarr;</div>
      </div>
    </Link>
  );
}

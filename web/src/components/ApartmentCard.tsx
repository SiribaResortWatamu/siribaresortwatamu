import Image from "next/image";
import Link from "next/link";
import { FaBed, FaBath, FaUserGroup } from "react-icons/fa6";
import { coverImage, type ApartmentWithPhotos } from "@/lib/apartments";

export default function ApartmentCard({
  apartment,
  showPrices = true,
}: {
  apartment: ApartmentWithPhotos;
  showPrices?: boolean;
}) {
  return (
    <div className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/accommodation/${apartment.slug}`} className="block">
        <div className="relative h-[240px] overflow-hidden">
          <Image
            src={coverImage(apartment)}
            alt={apartment.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </Link>
      <div className="p-8">
        <h3 className="font-display text-2xl text-ink">{apartment.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{apartment.description}</p>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted">
          <span className="flex items-center gap-2">
            <FaUserGroup className="text-ocean" /> {apartment.guests} Guests
          </span>
          <span className="flex items-center gap-2">
            <FaBed className="text-ocean" /> {apartment.bedrooms} Bedrooms
          </span>
          <span className="flex items-center gap-2">
            <FaBath className="text-ocean" /> {apartment.bathrooms} Bathrooms
          </span>
        </div>

        {showPrices && (
          <div className="mt-5 text-ink-muted">
            From <span className="font-display text-2xl text-terracotta">${apartment.price_usd}</span> / night
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Link
            href={`/accommodation/${apartment.slug}`}
            className="flex-1 rounded-full border border-terracotta px-5 py-2.5 text-center text-sm font-medium text-terracotta transition-colors hover:bg-terracotta hover:text-white"
          >
            View Details
          </Link>
          <Link
            href={`/accommodation/${apartment.slug}#book`}
            className="flex-1 rounded-full bg-terracotta px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-terracotta-hover"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Bath,
  BedDouble,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { Price } from "@/components/site/price";
import { BLUR_DATA_URL, IMAGE_PLACEHOLDER, coverAlt, coverImage } from "@/lib/images";
import { transferPriceLabel } from "@/lib/pricing";
import type {
  ApartmentWithPhotos,
  SafariWithDetail,
  TransferWithPhotos,
} from "@/lib/types";

const CARD_SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

function CardImage({
  src,
  alt,
  priority,
}: {
  src: string | null;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-sand-deep">
      <Image
        src={src ?? IMAGE_PLACEHOLDER}
        alt={alt}
        fill
        sizes={CARD_SIZES}
        priority={priority}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
      />
    </div>
  );
}

function Fact({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
      <span className="text-ocean">{icon}</span>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------
// Accommodation
// ---------------------------------------------------------------------
export function AccommodationCard({
  apartment,
  hidePrices,
  priority,
}: {
  apartment: ApartmentWithPhotos;
  hidePrices: boolean;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/accommodation/${apartment.slug}`}
      className="card card-hover group flex flex-col"
    >
      <CardImage
        src={coverImage(apartment.apartment_photos)}
        alt={coverAlt(apartment.apartment_photos, apartment.name)}
        priority={priority}
      />

      <div className="flex flex-1 flex-col p-6">
        <p className="text-[0.7rem] tracking-[0.15em] text-terracotta uppercase">
          {apartment.property_type}
        </p>
        <h3 className="mt-2 font-display text-xl font-semibold transition-colors group-hover:text-terracotta">
          {apartment.name}
        </h3>

        {apartment.short_description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-muted">
            {apartment.short_description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
          <Fact icon={<Users size={14} strokeWidth={1.5} />}>
            {apartment.max_guests} guests
          </Fact>
          <Fact icon={<BedDouble size={14} strokeWidth={1.5} />}>
            {apartment.bedrooms} bed{apartment.bedrooms === 1 ? "" : "s"}
          </Fact>
          <Fact icon={<Bath size={14} strokeWidth={1.5} />}>
            {apartment.bathrooms} bath{apartment.bathrooms === 1 ? "" : "s"}
          </Fact>
        </div>

        <div className="mt-6 flex items-end justify-between border-t border-line pt-5">
          <Price
            amount={apartment.nightly_rate}
            currency={apartment.currency}
            hidden={hidePrices}
            prefix="from"
            suffix="/ night"
          />
          <span className="inline-flex items-center gap-1 text-sm font-medium text-ocean">
            View details
            <ArrowUpRight
              size={15}
              strokeWidth={1.75}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------
// Safari
// ---------------------------------------------------------------------
export function SafariCard({
  safari,
  hidePrices,
  priority,
}: {
  safari: SafariWithDetail;
  hidePrices: boolean;
  priority?: boolean;
}) {
  const onEnquiry = safari.price_display_mode === "on_enquiry";

  return (
    <Link href={`/safaris/${safari.slug}`} className="card card-hover group flex flex-col">
      <div className="relative">
        <CardImage
          src={coverImage(safari.safari_photos)}
          alt={coverAlt(safari.safari_photos, safari.name)}
          priority={priority}
        />
        {safari.duration && (
          <span className="pill absolute top-4 left-4 bg-white/95 text-ink shadow-sm">
            <Clock size={12} strokeWidth={1.75} className="text-terracotta" />
            {safari.duration}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        {safari.destination && (
          <Fact icon={<MapPin size={14} strokeWidth={1.5} />}>{safari.destination}</Fact>
        )}
        <h3 className="mt-2 font-display text-xl font-semibold transition-colors group-hover:text-terracotta">
          {safari.name}
        </h3>

        {safari.short_description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-muted">
            {safari.short_description}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between border-t border-line pt-5">
          <Price
            amount={safari.price}
            currency={safari.currency}
            hidden={hidePrices}
            onEnquiry={onEnquiry}
            prefix={safari.price_display_mode === "from_price" ? "from" : undefined}
            suffix="pp"
          />
          <span className="inline-flex items-center gap-1 text-sm font-medium text-ocean">
            View safari
            <ArrowUpRight
              size={15}
              strokeWidth={1.75}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------
// Transfer
// ---------------------------------------------------------------------
export function TransferCard({
  transfer,
  hidePrices,
  priority,
}: {
  transfer: TransferWithPhotos;
  hidePrices: boolean;
  priority?: boolean;
}) {
  const onEnquiry = transfer.pricing_method === "on_enquiry";

  return (
    <Link
      href={`/transfers/${transfer.slug}`}
      className="card card-hover group flex flex-col"
    >
      <div className="relative">
        <CardImage
          src={coverImage(transfer.transfer_photos)}
          alt={coverAlt(transfer.transfer_photos, transfer.name)}
          priority={priority}
        />
        <span className="pill absolute top-4 left-4 bg-ocean/95 text-white">
          {transfer.service_type}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-semibold transition-colors group-hover:text-terracotta">
          {transfer.name}
        </h3>

        {transfer.short_description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-muted">
            {transfer.short_description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
          {transfer.journey_time && (
            <Fact icon={<Clock size={14} strokeWidth={1.5} />}>{transfer.journey_time}</Fact>
          )}
          <Fact icon={<Users size={14} strokeWidth={1.5} />}>
            up to {transfer.passenger_capacity}
          </Fact>
        </div>

        <div className="mt-6 flex items-end justify-between border-t border-line pt-5">
          <Price
            amount={transfer.price}
            currency={transfer.currency}
            hidden={hidePrices}
            onEnquiry={onEnquiry}
            prefix="from"
            suffix={transferPriceLabel(transfer.pricing_method)}
            size="sm"
          />
          <span className="inline-flex items-center gap-1 text-sm font-medium text-ocean">
            Details
            <ArrowUpRight
              size={15}
              strokeWidth={1.75}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

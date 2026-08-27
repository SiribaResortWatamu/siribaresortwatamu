import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BLUR_DATA_URL, IMAGE_PLACEHOLDER } from "@/lib/images";
import { cn } from "@/lib/utils";

export interface Crumb {
  href?: string;
  label: string;
}

/**
 * Shared hero for every inner page. Listing pages pass a stock image;
 * detail pages pass the record's own cover photo.
 */
export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  imageAlt,
  crumbs,
  children,
  compact,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  image?: string | null;
  imageAlt?: string;
  crumbs?: Crumb[];
  children?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        // Dark base: the overlay is semi-transparent, so without this a
        // slow or failed photo would leave white text on near-white.
        "relative flex items-end overflow-hidden bg-ink",
        compact ? "min-h-[46vh] md:min-h-[52vh]" : "min-h-[62vh] md:min-h-[70vh]",
      )}
    >
      <Image
        src={image || IMAGE_PLACEHOLDER}
        alt={imageAlt ?? title}
        fill
        priority
        sizes="100vw"
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/50 to-ink/45" />

      <div className="shell relative z-10 pt-32 pb-14 md:pb-20">
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-white/60">
              {crumbs.map((crumb, i) => (
                <li key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight size={12} strokeWidth={1.75} />}
                  {crumb.href ? (
                    <Link href={crumb.href} className="transition-colors hover:text-white">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-white/90">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {eyebrow && (
          <p className="text-[0.7rem] font-medium tracking-[0.24em] text-white/70 uppercase">
            {eyebrow}
          </p>
        )}

        <h1 className="display-xl mt-4 max-w-4xl text-balance text-white">{title}</h1>

        {intro && (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">{intro}</p>
        )}

        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

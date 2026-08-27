"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { telLink } from "@/lib/whatsapp";
import { SiteLogo } from "@/components/site/site-logo";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/accommodation", label: "Accommodation" },
  { href: "/safaris", label: "Safaris" },
  { href: "/transfers", label: "Transfers" },
  { href: "/amenities", label: "Amenities" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({
  propertyName,
  phone,
  logoPath,
  logoLightPath,
}: {
  propertyName: string;
  phone: string | null;
  logoPath: string | null;
  logoLightPath: string | null;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // The homepage hero sits behind a transparent header; every other page
  // starts with a solid one so the navigation stays readable.
  const overHero = pathname === "/";
  const solid = scrolled || !overHero || open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Stop the page behind the mobile menu from scrolling.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const tel = telLink(phone);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        solid
          ? "bg-sand/95 shadow-[0_1px_0_rgba(224,214,198,1)] backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <div className="shell flex h-18 items-center justify-between gap-6 py-4 lg:h-20">
        <Link href="/" aria-label={`${propertyName} — home`} className="shrink-0">
          {/* Both artworks are rendered and cross-faded, rather than swapped
              on the `solid` flag. Swapping the src would re-fetch and flash
              the logo every time the header changes state on scroll. */}
          <span className="relative block h-9 w-[10.5rem] sm:h-10 sm:w-[12rem]">
            <SiteLogo
              variant="dark"
              logoPath={logoPath}
              logoLightPath={logoLightPath}
              propertyName={propertyName}
              priority
              className={cn(
                "absolute inset-0 h-full transition-opacity duration-500",
                solid ? "opacity-100" : "opacity-0",
              )}
            />
            <SiteLogo
              variant="light"
              logoPath={logoPath}
              logoLightPath={logoLightPath}
              propertyName={propertyName}
              priority
              className={cn(
                "absolute inset-0 h-full transition-opacity duration-500",
                solid ? "opacity-0" : "opacity-100",
              )}
            />
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative text-sm font-normal transition-colors",
                  solid
                    ? active
                      ? "text-terracotta"
                      : "text-ink-muted hover:text-ink"
                    : active
                      ? "text-white"
                      : "text-white/80 hover:text-white",
                )}
              >
                {item.label}
                {active && (
                  <span
                    className={cn(
                      "absolute -bottom-1.5 left-0 h-px w-full",
                      solid ? "bg-terracotta" : "bg-white",
                    )}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {tel && (
            <a
              href={tel}
              aria-label="Call us"
              className={cn(
                "hidden h-10 w-10 items-center justify-center rounded-full border transition-colors md:flex",
                solid
                  ? "border-line text-ink-muted hover:border-ink hover:text-ink"
                  : "border-white/40 text-white hover:bg-white hover:text-ink",
              )}
            >
              <Phone size={16} strokeWidth={1.5} />
            </a>
          )}

          <Link
            href="/accommodation"
            className={cn(
              "btn btn-sm px-5 lg:px-7 lg:py-3.5 lg:text-[0.9375rem]",
              solid ? "btn-primary" : "btn-on-dark",
            )}
          >
            Book Now
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-colors lg:hidden",
              solid ? "text-ink hover:bg-sand-deep" : "text-white hover:bg-white/15",
            )}
          >
            {open ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      <div
        className={cn(
          "overflow-hidden border-t border-line bg-sand transition-[max-height] duration-500 lg:hidden",
          open ? "max-h-[32rem]" : "max-h-0 border-t-0",
        )}
      >
        <nav className="shell flex flex-col py-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="border-b border-line/70 py-3.5 text-[0.95rem] text-ink last:border-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

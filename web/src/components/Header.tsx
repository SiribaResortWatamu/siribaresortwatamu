"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/accommodation", label: "Accommodation" },
  { href: "/amenities", label: "Amenities" },
  { href: "/safaris", label: "Safaris" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || menuOpen;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? "bg-white/95 backdrop-blur-sm shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="relative z-10 flex items-center gap-2">
          <Image
            src="/images/Siriba Resort Watamu Logo Design-black.png"
            alt="Siriba Resort"
            width={160}
            height={40}
            className={`h-9 w-auto transition-opacity duration-300 ${solid ? "opacity-100" : "opacity-0 absolute"}`}
            priority
          />
          <Image
            src="/images/Siriba Resort Watamu Logo Design-white.png"
            alt="Siriba Resort"
            width={160}
            height={40}
            className={`h-9 w-auto transition-opacity duration-300 ${solid ? "opacity-0 absolute" : "opacity-100"}`}
            priority
          />
        </Link>

        <nav
          className={`hidden items-center gap-8 font-medium md:flex ${
            solid ? "text-ink" : "text-white"
          }`}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-terracotta"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/accommodation"
            className="rounded-full bg-terracotta px-6 py-2.5 font-medium text-white transition-colors hover:bg-terracotta-hover"
          >
            Book Now
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
          className="relative z-10 flex h-8 w-8 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span
            className={`h-0.5 w-6 rounded transition-all ${solid ? "bg-ink" : "bg-white"} ${
              menuOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`h-0.5 w-6 rounded transition-all ${solid ? "bg-ink" : "bg-white"} ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`h-0.5 w-6 rounded transition-all ${solid ? "bg-ink" : "bg-white"} ${
              menuOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-hairline bg-white px-6 pb-6 pt-2 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-2 py-3 font-medium text-ink hover:bg-sand"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/accommodation"
            onClick={() => setMenuOpen(false)}
            className="mt-2 rounded-full bg-terracotta px-6 py-3 text-center font-medium text-white"
          >
            Book Now
          </Link>
        </nav>
      )}
    </header>
  );
}

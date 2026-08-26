import Link from "next/link";
import { Lock, Mail, MapPin, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/icons";
import type { PublicSettings } from "@/lib/types";
import { telLink, whatsappLink } from "@/lib/whatsapp";

const EXPLORE = [
  { href: "/accommodation", label: "Accommodation" },
  { href: "/safaris", label: "Safaris" },
  { href: "/transfers", label: "Transfers" },
  { href: "/amenities", label: "Amenities" },
];

const COMPANY = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
];

export function SiteFooter({ settings }: { settings: PublicSettings }) {
  const wa = whatsappLink(settings.whatsapp, "Hello! I'd like to ask about a stay at Siriba Resort.");
  const tel = telLink(settings.phone);

  return (
    <footer className="bg-ink text-sand">
      <div className="shell py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.4fr]">
          <div>
            <p className="font-display text-2xl font-semibold text-white">
              {settings.property_name}
            </p>
            <p className="mt-1 text-[0.65rem] tracking-[0.22em] text-sand/50 uppercase">
              Watamu · Kilifi County · Kenya
            </p>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-sand/70">
              Self-catering apartments a short walk from the Watamu Marine National Park,
              with safaris inland and private transfers along the coast. Book with us
              directly and deal with the people who run the place.
            </p>

            <div className="mt-7 flex gap-3">
              {settings.facebook_url && (
                <SocialLink href={settings.facebook_url} label="Facebook">
                  <FacebookIcon size={17} />
                </SocialLink>
              )}
              {settings.instagram_url && (
                <SocialLink href={settings.instagram_url} label="Instagram">
                  <InstagramIcon size={17} />
                </SocialLink>
              )}
              {wa && (
                <SocialLink href={wa} label="WhatsApp">
                  <WhatsAppIcon size={17} />
                </SocialLink>
              )}
            </div>
          </div>

          <FooterColumn title="Explore" links={EXPLORE} />
          <FooterColumn title="Siriba" links={COMPANY} />

          <div>
            <h3 className="text-xs font-medium tracking-[0.18em] text-sand/50 uppercase">
              Get in touch
            </h3>
            <ul className="mt-5 space-y-4 text-sm">
              {settings.address && (
                <li className="flex gap-3 text-sand/75">
                  <MapPin size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-terracotta" />
                  <span>{settings.address}</span>
                </li>
              )}
              {tel && (
                <li className="flex gap-3">
                  <Phone size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-terracotta" />
                  <a href={tel} className="text-sand/75 transition-colors hover:text-white">
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings.email && (
                <li className="flex gap-3">
                  <Mail size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-terracotta" />
                  <a
                    href={`mailto:${settings.email}`}
                    className="break-all text-sand/75 transition-colors hover:text-white"
                  >
                    {settings.email}
                  </a>
                </li>
              )}
            </ul>

            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp btn-sm mt-6"
              >
                <WhatsAppIcon size={15} />
                Chat on WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-7 text-xs text-sand/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.property_name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/privacy-policy" className="transition-colors hover:text-sand">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-sand">
              Terms & Conditions
            </Link>

            {/* Staff entrance. Deliberately quiet — it is for the owner, not
                for guests — and opens in its own tab so a guest who wanders
                in does not lose the page they were reading. */}
            <a
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sand/40 transition-colors hover:text-sand"
            >
              <Lock size={11} strokeWidth={1.75} />
              Staff Login
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-medium tracking-[0.18em] text-sand/50 uppercase">{title}</h3>
      <ul className="mt-5 space-y-3 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sand/75 transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-sand/70 transition-colors hover:border-white/60 hover:bg-white hover:text-ink"
    >
      {children}
    </a>
  );
}

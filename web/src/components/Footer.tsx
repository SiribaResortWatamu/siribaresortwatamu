import Link from "next/link";
import {
  FaLocationDot,
  FaPhone,
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
} from "react-icons/fa6";

const QUICK_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/accommodation", label: "Accommodation" },
  { href: "/amenities", label: "Amenities" },
  { href: "/safaris", label: "Safaris" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-sand-deep">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <h3 className="mb-4 font-display text-2xl text-white">Siriba Resort</h3>
            <p className="text-sm leading-relaxed text-sand-deep/80">
              Luxury, comfort &amp; coastal living in Watamu, Kenya — your destination for
              relaxation and adventure.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-display text-2xl text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sand-deep/80 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-2xl text-white">Contact Us</h3>
            <ul className="space-y-3 text-sm text-sand-deep/80">
              <li className="flex items-start gap-3">
                <FaLocationDot className="mt-1 shrink-0 text-terracotta" />
                Neverland Junction, Jacaranda Road, Watamu
              </li>
              <li className="flex items-center gap-3">
                <FaPhone className="shrink-0 text-terracotta" />
                <a href="tel:+254723862921" className="hover:text-white">
                  +254 723 862 921
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FaWhatsapp className="shrink-0 text-terracotta" />
                <a
                  href="https://wa.me/254723862921"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  +254 723 862 921
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FaEnvelope className="shrink-0 text-terracotta" />
                <a href="mailto:siribaresortwatamu@gmail.com" className="hover:text-white">
                  siribaresortwatamu@gmail.com
                </a>
              </li>
            </ul>
            <div className="mt-6 flex gap-4">
              <a
                href="https://web.facebook.com/profile.php?id=61572056341645"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-lg text-sand-deep/80 hover:text-white"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://www.instagram.com/siribaresortwatamu/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-lg text-sand-deep/80 hover:text-white"
              >
                <FaInstagram />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-sand-deep/60">
          &copy; {year} Siriba Resort. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

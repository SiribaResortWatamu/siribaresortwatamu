import type { Metadata } from "next";
import { FaLocationDot, FaPhone, FaEnvelope, FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa6";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Siriba Resort in Watamu for bookings, inquiries, and more information about our luxury coastal retreat.",
};

const SOCIALS = [
  { icon: FaFacebookF, href: "https://web.facebook.com/profile.php?id=61572056341645", label: "Facebook" },
  { icon: FaInstagram, href: "https://www.instagram.com/siribaresortwatamu/", label: "Instagram" },
  { icon: FaWhatsapp, href: "https://wa.me/254723862921", label: "WhatsApp" },
];

export default function ContactPage() {
  return (
    <>
      <section className="px-6 pb-12 pt-36 text-center">
        <h1 className="font-display text-4xl text-ink md:text-5xl">Get In Touch</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-muted">
          We look forward to welcoming you to Siriba Resort. Whether you have a question about
          your booking, amenities, or special requests, our team is ready to assist.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <div className="h-fit rounded-2xl bg-white p-10 shadow-sm">
            <h3 className="font-display text-2xl text-ink">Contact Information</h3>

            <div className="mt-8 flex items-start gap-4">
              <FaLocationDot className="mt-1 shrink-0 text-xl text-ocean" />
              <div>
                <h4 className="font-medium text-ink">Address</h4>
                <p className="mt-1 text-ink-muted">Neverland Junction, Jacaranda Road, Watamu, Kenya</p>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-4">
              <FaPhone className="mt-1 shrink-0 text-xl text-ocean" />
              <div>
                <h4 className="font-medium text-ink">Phone &amp; WhatsApp</h4>
                <a href="tel:+254723862921" className="mt-1 block text-ink-muted hover:text-terracotta">
                  +254 723 862 921
                </a>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-4">
              <FaEnvelope className="mt-1 shrink-0 text-xl text-ocean" />
              <div>
                <h4 className="font-medium text-ink">Email</h4>
                <a
                  href="mailto:siribaresortwatamu@gmail.com"
                  className="mt-1 block text-ink-muted hover:text-terracotta"
                >
                  siribaresortwatamu@gmail.com
                </a>
              </div>
            </div>

            <h4 className="mt-8 mb-3 font-medium text-ink">Follow Us</h4>
            <div className="flex gap-3">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-sand text-ocean transition-colors hover:bg-ocean hover:text-white"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-10 shadow-sm">
            <h3 className="font-display text-2xl text-ink">Send Us a Message</h3>
            <p className="mt-3 rounded-xl bg-sand p-4 text-sm text-ink-muted">
              The contact form connects in the next build phase. In the meantime, please reach us
              directly by phone, WhatsApp, or email above.
            </p>

            <form className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Your Name"
                  disabled
                  className="rounded-lg border border-hairline bg-sand/50 px-4 py-3 text-ink-muted"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  disabled
                  className="rounded-lg border border-hairline bg-sand/50 px-4 py-3 text-ink-muted"
                />
              </div>
              <select
                disabled
                defaultValue=""
                className="w-full rounded-lg border border-hairline bg-sand/50 px-4 py-3 text-ink-muted"
              >
                <option value="" disabled>
                  Subject of Inquiry
                </option>
                <option value="booking">Room Booking</option>
                <option value="events">Events &amp; Weddings</option>
                <option value="general">General Information</option>
              </select>
              <textarea
                placeholder="Your Message"
                rows={5}
                disabled
                className="w-full rounded-lg border border-hairline bg-sand/50 px-4 py-3 text-ink-muted"
              />
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-full bg-terracotta/50 px-6 py-3 font-medium text-white"
              >
                Send Message (Coming Soon)
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="h-[450px] w-full">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3983.063172314139!2d40.0326224!3d-3.3345697000000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x181581f0bbc5f039%3A0xf8fbb75e49b7048a!2sSiriba%20Resort%20Watamu!5e0!3m2!1ssw!2ske!4v1776425855597!5m2!1ssw!2ske"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Siriba Resort Watamu location"
        />
      </section>
    </>
  );
}

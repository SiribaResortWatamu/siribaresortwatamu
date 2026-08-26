import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { ContactForm } from "@/components/site/contact-form";
import { PageHero } from "@/components/site/page-hero";
import { getPublicSettings } from "@/lib/data/settings";
import { telLink, whatsappLink } from "@/lib/whatsapp";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Siriba Resort Watamu — phone, WhatsApp, email and directions to the property on the Kenyan coast.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getPublicSettings();
  const wa = whatsappLink(settings.whatsapp, "Hello! I have a question about Siriba Resort.");
  const tel = telLink(settings.phone);

  return (
    <>
      <PageHero
        eyebrow="Say hello"
        title="Contact Us"
        intro="Every message reaches a real person here in Watamu — not a call centre. We answer in English or Kiswahili, usually the same day."
        image="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2400&q=80"
        imageAlt="The coast at Watamu"
        crumbs={[{ href: "/", label: "Home" }, { label: "Contact" }]}
        compact
      />

      <section className="section-y bg-sand">
        <div className="shell grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          {/* Details --------------------------------------------------- */}
          <div>
            <p className="eyebrow">Details</p>
            <h2 className="display-md mt-3">How to reach us</h2>

            <dl className="mt-9 space-y-7">
              {settings.address && (
                <ContactRow icon={<MapPin size={19} strokeWidth={1.4} />} label="Address">
                  {settings.address}
                </ContactRow>
              )}

              {settings.phone && (
                <ContactRow icon={<Phone size={19} strokeWidth={1.4} />} label="Phone">
                  <a href={tel ?? "#"} className="transition-colors hover:text-terracotta">
                    {settings.phone}
                  </a>
                </ContactRow>
              )}

              {wa && (
                <ContactRow
                  icon={<WhatsAppIcon size={19} />}
                  label="WhatsApp"
                >
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-terracotta"
                  >
                    Start a chat
                  </a>
                </ContactRow>
              )}

              {settings.email && (
                <ContactRow icon={<Mail size={19} strokeWidth={1.4} />} label="Email">
                  <a
                    href={`mailto:${settings.email}`}
                    className="break-all transition-colors hover:text-terracotta"
                  >
                    {settings.email}
                  </a>
                </ContactRow>
              )}

              <ContactRow icon={<Clock size={19} strokeWidth={1.4} />} label="Reception">
                <span className="block">
                  Check-in from {settings.check_in_time ?? "14:00"}
                </span>
                <span className="block">
                  Check-out by {settings.check_out_time ?? "10:00"}
                </span>
                <span className="mt-1 block text-sm text-ink-muted">
                  Gate staffed 24 hours
                </span>
              </ContactRow>
            </dl>

            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp mt-9"
              >
                <WhatsAppIcon size={16} />
                Message us on WhatsApp
              </a>
            )}
          </div>

          <ContactForm />
        </div>
      </section>

      {/* Map -------------------------------------------------------------- */}
      {settings.map_embed_url && (
        <section className="bg-sand-deep pb-20">
          <div className="shell">
            <div className="overflow-hidden rounded-3xl border border-line">
              <iframe
                src={settings.map_embed_url}
                title="Map showing Siriba Resort Watamu"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[26rem] w-full border-0"
              />
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ocean-soft text-ocean">
        {icon}
      </span>
      <div>
        <dt className="text-[0.65rem] tracking-[0.14em] text-ink-muted uppercase">
          {label}
        </dt>
        <dd className="mt-1 leading-relaxed">{children}</dd>
      </div>
    </div>
  );
}

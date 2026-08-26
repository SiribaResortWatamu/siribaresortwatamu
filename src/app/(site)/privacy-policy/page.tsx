import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { getPublicSettings } from "@/lib/data/settings";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Siriba Resort Watamu collects, uses and protects the personal information you give us when you book or enquire.",
  alternates: { canonical: "/privacy-policy" },
};

export default async function PrivacyPolicyPage() {
  const settings = await getPublicSettings();
  const contact = settings.email ?? "the property";

  return (
    <LegalPage
      title="Privacy Policy"
      intro="What we collect when you book or enquire, why we need it, and what we do with it."
      updated="26 August 2026"
      sections={[
        {
          heading: "Who we are",
          paragraphs: [
            `${settings.property_name} operates this website and is responsible for the personal information described below. Our address is ${settings.address ?? "Watamu, Kilifi County, Kenya"}.`,
          ],
        },
        {
          heading: "What we collect",
          paragraphs: [
            "We only ask for what we need to answer you and to run your booking. That is:",
          ],
          bullets: [
            "Your name, email address, phone number and WhatsApp number.",
            "The dates, accommodation, safari or transfer you are enquiring about, and the number of people travelling.",
            "Anything you choose to tell us in a message or special request — for example dietary needs or an arrival time.",
            "Payment records: the amount, method and reference of payments you make to us. We do not take card payments on this website and we never store card numbers.",
          ],
        },
        {
          heading: "Why we use it",
          bullets: [
            "To confirm availability and answer your enquiry.",
            "To manage your booking, arrange your transfer and assign a driver.",
            "To send you booking confirmations, arrival information and, after your stay, a short thank-you.",
            "To keep the accounting records the business is required to keep.",
          ],
        },
        {
          heading: "Who we share it with",
          paragraphs: [
            "We do not sell your information and we do not share it for marketing.",
            "We share the minimum necessary with the people who help us deliver your booking: the driver assigned to your transfer gets your name, pick-up details and phone number; a safari operator gets the traveller details needed to book park entry and accommodation.",
            "The website runs on hosting and database services and sends email through a delivery provider. Those providers process data on our instructions only.",
          ],
        },
        {
          heading: "How long we keep it",
          paragraphs: [
            "Enquiries that do not become bookings are kept for up to two years so we recognise you if you come back to us. Booking and payment records are kept for seven years, which is what tax and accounting rules require.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            `You can ask us for a copy of what we hold about you, ask us to correct it, or ask us to delete it where we are not required to keep it. Write to ${contact} and we will respond within 30 days.`,
            "Kenya's Data Protection Act 2019 governs how we handle your information, and you have the right to complain to the Office of the Data Protection Commissioner.",
          ],
        },
        {
          heading: "Cookies",
          paragraphs: [
            "This website uses only the cookies needed to make it work — for example keeping you signed in to the staff dashboard. We do not run advertising trackers or third-party analytics profiling.",
          ],
        },
        {
          heading: "Contact",
          paragraphs: [
            `Any question about this policy: ${contact}${settings.phone ? `, or call ${settings.phone}` : ""}.`,
          ],
        },
      ]}
    />
  );
}

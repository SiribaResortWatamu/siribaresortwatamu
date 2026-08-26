import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { getPublicSettings } from "@/lib/data/settings";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Booking terms, deposits, cancellation policy and house rules for stays, safaris and transfers at Siriba Resort Watamu.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const settings = await getPublicSettings();

  return (
    <LegalPage
      title="Terms & Conditions"
      intro="The basis on which we take bookings for accommodation, safaris and transfers."
      updated="26 August 2026"
      sections={[
        {
          heading: "Making a booking",
          paragraphs: [
            "Submitting the booking form on this website is a request, not a confirmed booking. We check availability and come back to you — usually within a few hours.",
            "Where a temporary hold is applied, your dates are reserved for a short period while we confirm. If we do not hear from you before the hold expires, the dates are released automatically.",
            "A booking is confirmed only when we say so in writing and the deposit has been received.",
          ],
        },
        {
          heading: "Rates and payment",
          paragraphs: [
            settings.booking_terms ??
              "A deposit confirms your dates. The balance is settled on arrival. Rates are quoted per apartment, per night, unless stated otherwise.",
            "Rates are quoted in the currency shown on the page and include all taxes applicable at the time of booking. We do not add resort fees or service charges at check-out.",
            "We do not take card payments through this website. Payment is arranged directly with us by bank transfer or mobile money, and every payment is receipted against your booking reference.",
          ],
        },
        {
          heading: "Cancellation and changes",
          paragraphs: [
            settings.cancellation_policy ??
              "Free cancellation up to 14 days before arrival. Within 14 days, the deposit is non-refundable.",
            "If you need to move your dates, ask us. We will do what we can, subject to availability, and we do not charge an amendment fee.",
            "If we ever have to cancel your booking — which is rare, and would only be for something we cannot control — you receive a full refund of everything paid.",
          ],
        },
        {
          heading: "Arrival and departure",
          paragraphs: [
            `Check-in is from ${settings.check_in_time ?? "14:00"} and check-out is by ${settings.check_out_time ?? "10:00"}. Earlier arrival and later departure can often be arranged at no charge if the apartment is free — ask on the day before.`,
          ],
        },
        {
          heading: "House rules",
          bullets: [
            "The apartment is let to the number of guests on the booking. Please tell us before you bring anyone else.",
            "No smoking inside the apartments. The gardens and terraces are fine.",
            "Please keep noise down between 22:00 and 07:00 out of respect for other guests.",
            "You are responsible for damage or breakages beyond fair wear and tear.",
            "Children are very welcome. The pool is unfenced and is not lifeguarded — children must be supervised at all times.",
          ],
        },
        {
          heading: "Safaris",
          paragraphs: [
            "Safari prices are per person sharing and depend on the number travelling, the season and park fees current at the time. The price is confirmed in writing when you accept our quote.",
            "Wildlife sightings, migration timing and weather cannot be guaranteed. Itineraries may be adjusted by your guide for safety, road conditions or park regulations.",
            "Domestic flights carry luggage limits set by the airline, not by us.",
          ],
        },
        {
          heading: "Transfers",
          paragraphs: [
            "Transfer prices are fixed and confirmed before travel. Waiting time, night surcharges and additional stops are charged as set out on the service page.",
            "We track flights and trains, so a delayed arrival does not cost you the transfer. If your plans change, tell us as soon as you can.",
          ],
        },
        {
          heading: "Liability",
          paragraphs: [
            "We take reasonable care in everything we arrange. We are not liable for loss, injury or delay caused by circumstances outside our reasonable control, or for valuables left unattended.",
            "We strongly recommend comprehensive travel insurance covering medical treatment, cancellation and your belongings.",
          ],
        },
        {
          heading: "Governing law",
          paragraphs: [
            "These terms are governed by the laws of Kenya, and any dispute is subject to the jurisdiction of the Kenyan courts.",
          ],
        },
      ]}
    />
  );
}

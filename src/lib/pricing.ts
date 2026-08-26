import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Apartment, PricingMethod, TransferService } from "@/lib/types";

/**
 * Pricing lives on the server and nowhere else.
 *
 * Booking forms post dates and guest counts; they never post a price. The
 * total that reaches the database is always computed here from the rate
 * currently stored on the record, then frozen onto the booking as a
 * snapshot so later rate changes cannot rewrite history.
 */

export interface StayQuote {
  nights: number;
  rate: number;
  accommodationTotal: number;
  cleaningFee: number;
  total: number;
  depositRequired: number;
  currency: string;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
}

export function quoteStay(
  apartment: Pick<
    Apartment,
    "nightly_rate" | "cleaning_fee" | "currency" | "deposit_percent"
  >,
  checkIn: string,
  checkOut: string,
): StayQuote {
  const nights = Math.max(0, nightsBetween(checkIn, checkOut));
  const rate = Number(apartment.nightly_rate) || 0;
  const cleaningFee = Number(apartment.cleaning_fee) || 0;

  const accommodationTotal = round(rate * nights);
  const total = round(accommodationTotal + (nights > 0 ? cleaningFee : 0));
  const depositRequired = round((total * (apartment.deposit_percent ?? 0)) / 100);

  return {
    nights,
    rate,
    accommodationTotal,
    cleaningFee: nights > 0 ? cleaningFee : 0,
    total,
    depositRequired,
    currency: apartment.currency || "KES",
  };
}

export interface TransferQuote {
  method: PricingMethod;
  unitPrice: number;
  quantity: number;
  total: number;
  currency: string;
  /** True when the total cannot be determined without speaking to the guest. */
  onEnquiry: boolean;
  basis: string;
}

export function quoteTransfer(
  service: Pick<TransferService, "pricing_method" | "price" | "currency">,
  input: { passengers?: number; vehicles?: number; hours?: number } = {},
): TransferQuote {
  const unitPrice = Number(service.price) || 0;
  const currency = service.currency || "KES";
  const method = service.pricing_method;

  if (method === "on_enquiry") {
    return {
      method,
      unitPrice: 0,
      quantity: 0,
      total: 0,
      currency,
      onEnquiry: true,
      basis: "Price on enquiry",
    };
  }

  const quantity =
    method === "per_person"
      ? Math.max(1, input.passengers ?? 1)
      : method === "per_vehicle"
        ? Math.max(1, input.vehicles ?? 1)
        : method === "hourly"
          ? Math.max(1, input.hours ?? 1)
          : 1;

  const basis =
    method === "per_person"
      ? "per person"
      : method === "per_vehicle"
        ? "per vehicle"
        : method === "hourly"
          ? "per hour"
          : "per transfer";

  return {
    method,
    unitPrice,
    quantity,
    total: round(unitPrice * quantity),
    currency,
    onEnquiry: false,
    basis,
  };
}

/** How a transfer price should be labelled on the public site. */
export function transferPriceLabel(method: PricingMethod): string {
  switch (method) {
    case "per_person":
      return "per person";
    case "per_vehicle":
      return "per vehicle";
    case "hourly":
      return "per hour";
    case "on_enquiry":
      return "";
    default:
      return "per transfer";
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

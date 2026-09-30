import type {
  Booking,
  BillingDocument,
  DocumentLine,
  DocumentType,
  SafariEnquiry,
  TransferBooking,
} from "@/lib/types";
import { formatDate } from "@/lib/format";

/**
 * Billing documents.
 *
 * As with booking prices, totals are never trusted from the browser: the
 * form posts line items and a discount, and everything else is worked out
 * here on the server.
 */

export const DOCUMENT_LABELS: Record<
  DocumentType,
  { singular: string; plural: string; prefix: string }
> = {
  quotation: { singular: "Quotation", plural: "Quotations", prefix: "QUO" },
  invoice: { singular: "Invoice", plural: "Invoices", prefix: "INV" },
  receipt: { singular: "Receipt", plural: "Receipts", prefix: "RCT" },
};

export function isDocumentType(value: unknown): value is DocumentType {
  return value === "quotation" || value === "invoice" || value === "receipt";
}

const round = (value: number) => Math.round(value * 100) / 100;

export function cleanLines(input: unknown): DocumentLine[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((row) => {
      const line = row as Partial<DocumentLine>;
      return {
        description: String(line.description ?? "").trim().slice(0, 400),
        quantity: Number(line.quantity) > 0 ? Number(line.quantity) : 0,
        unit_price: Number.isFinite(Number(line.unit_price)) ? Number(line.unit_price) : 0,
      };
    })
    .filter((line) => line.description && line.quantity > 0);
}

export function lineTotal(line: DocumentLine): number {
  return round(line.quantity * line.unit_price);
}

export function computeTotals(lines: DocumentLine[], discount: number) {
  const subtotal = round(lines.reduce((sum, line) => sum + lineTotal(line), 0));
  const safeDiscount = Math.min(Math.max(0, round(discount)), Math.max(0, subtotal));
  return { subtotal, discount: safeDiscount, total: round(subtotal - safeDiscount) };
}

/** What has been paid against an invoice, from its issued receipts. */
export function paidAgainst(receipts: Pick<BillingDocument, "total" | "status">[]): number {
  return round(
    receipts.filter((r) => r.status === "issued").reduce((sum, r) => sum + Number(r.total), 0),
  );
}

/** Where a document's line items and client details start from. */
export interface DocumentDraft {
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  currency: string;
  lines: DocumentLine[];
  link: {
    booking_id?: string;
    transfer_booking_id?: string;
    safari_enquiry_id?: string;
    guest_id?: string | null;
  };
  notes?: string;
}

export function draftFromBooking(booking: Booking): DocumentDraft {
  const lines: DocumentLine[] = [
    {
      description: `${booking.apartment_name_snapshot} — ${formatDate(booking.check_in)} to ${formatDate(booking.check_out)}`,
      quantity: Math.max(1, booking.nights),
      unit_price: Number(booking.rate_snapshot),
    },
  ];
  if (Number(booking.cleaning_fee_snapshot) > 0) {
    lines.push({
      description: "Cleaning fee",
      quantity: 1,
      unit_price: Number(booking.cleaning_fee_snapshot),
    });
  }

  // A negotiated total will not equal rate × nights + cleaning. Rather than
  // print a document whose lines disagree with what the guest agreed to,
  // show the difference as its own line.
  const computed = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const adjustment = round(Number(booking.total_snapshot) - computed);
  if (adjustment !== 0) {
    lines.push({
      description: adjustment < 0 ? "Agreed discount" : "Adjustment",
      quantity: 1,
      unit_price: adjustment,
    });
  }

  return {
    clientName: booking.guest_name_snapshot,
    clientEmail: booking.guest_email_snapshot,
    clientPhone: booking.guest_phone_snapshot,
    currency: booking.currency,
    lines,
    link: { booking_id: booking.id, guest_id: booking.guest_id },
    notes: `Booking reference ${booking.booking_reference}`,
  };
}

export function draftFromTransfer(transfer: TransferBooking): DocumentDraft {
  return {
    clientName: transfer.passenger_name,
    clientEmail: transfer.email,
    clientPhone: transfer.phone,
    currency: transfer.currency,
    lines: [
      {
        description: `${transfer.transfer_name_snapshot} — ${transfer.pickup_location} to ${transfer.dropoff_location}, ${formatDate(transfer.transfer_date)}`,
        quantity: 1,
        unit_price: Number(transfer.price_snapshot),
      },
    ],
    link: { transfer_booking_id: transfer.id, guest_id: transfer.guest_id },
    notes: `Transfer reference ${transfer.reference}`,
  };
}

export function draftFromEnquiry(enquiry: SafariEnquiry): DocumentDraft {
  const travellers = `${enquiry.travellers} ${enquiry.travellers === 1 ? "traveller" : "travellers"}`;
  const when = enquiry.travel_date ? `, ${formatDate(enquiry.travel_date)}` : "";
  return {
    clientName: enquiry.name,
    clientEmail: enquiry.email,
    clientPhone: enquiry.whatsapp ?? enquiry.phone,
    currency: enquiry.currency,
    lines: [
      {
        description: `${enquiry.safari_name_snapshot} — ${travellers}${when}`,
        quantity: 1,
        unit_price: Number(enquiry.quoted_amount ?? 0),
      },
    ],
    link: { safari_enquiry_id: enquiry.id, guest_id: enquiry.guest_id },
    notes: `Enquiry reference ${enquiry.reference}`,
  };
}

/** Default validity for a quotation, and payment terms for an invoice. */
export function defaultDueDate(type: DocumentType, from = new Date()): string | null {
  if (type === "receipt") return null;
  const days = type === "quotation" ? 14 : 7;
  const due = new Date(from);
  due.setDate(due.getDate() + days);
  const y = due.getFullYear();
  const m = String(due.getMonth() + 1).padStart(2, "0");
  const d = String(due.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

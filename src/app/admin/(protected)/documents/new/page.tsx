import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/admin/ui";
import { DocumentEditor, type EditorValues } from "@/components/admin/document-editor";
import {
  DOCUMENT_LABELS,
  defaultDueDate,
  draftFromBooking,
  draftFromEnquiry,
  draftFromTransfer,
  isDocumentType,
  type DocumentDraft,
} from "@/lib/documents";
import { getSettings } from "@/lib/data/settings";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Booking, SafariEnquiry, TransferBooking } from "@/lib/types";

export const metadata = { title: "New document" };

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    booking?: string;
    transfer?: string;
    enquiry?: string;
  }>;
}) {
  const { type, booking, transfer, enquiry } = await searchParams;
  if (!isDocumentType(type)) notFound();

  const db = supabaseAdmin();
  const settings = await getSettings();
  const isId = (v?: string) => Boolean(v && z.uuid().safeParse(v).success);

  let draft: DocumentDraft | null = null;
  let paid = 0;
  let payment: { method: string; reference: string; date: string } | null = null;

  if (isId(booking)) {
    const { data } = await db.from("bookings").select("*").eq("id", booking!).maybeSingle();
    if (data) {
      const b = data as Booking;
      draft = draftFromBooking(b);
      paid = Number(b.amount_paid);
      payment = {
        method: b.payment_method ?? "",
        reference: b.payment_reference ?? "",
        date: b.payment_date ?? "",
      };
    }
  } else if (isId(transfer)) {
    const { data } = await db
      .from("transfer_bookings")
      .select("*")
      .eq("id", transfer!)
      .maybeSingle();
    if (data) {
      const t = data as TransferBooking;
      draft = draftFromTransfer(t);
      paid = Number(t.amount_paid);
      payment = { method: t.payment_method ?? "", reference: t.payment_reference ?? "", date: "" };
    }
  } else if (isId(enquiry)) {
    const { data } = await db
      .from("safari_enquiries")
      .select("*")
      .eq("id", enquiry!)
      .maybeSingle();
    if (data) draft = draftFromEnquiry(data as SafariEnquiry);
  }

  // A receipt records money that has actually arrived, so when it starts
  // from a booking the line is the amount already paid, not the whole price.
  let lines = draft?.lines ?? [];
  if (type === "receipt" && draft && (booking || transfer)) {
    lines = [
      {
        description: `Payment received — ${draft.notes ?? "booking"}`,
        quantity: 1,
        unit_price: paid,
      },
    ];
  }

  const values: EditorValues = {
    docType: type,
    clientName: draft?.clientName ?? "",
    clientEmail: draft?.clientEmail ?? "",
    clientPhone: draft?.clientPhone ?? "",
    clientAddress: "",
    currency: draft?.currency ?? settings?.default_currency ?? "KES",
    issueDate: "",
    dueDate: defaultDueDate(type) ?? "",
    paymentMethod: type === "receipt" ? (payment?.method ?? "") : "",
    paymentReference: type === "receipt" ? (payment?.reference ?? "") : "",
    paymentDate: type === "receipt" ? (payment?.date ?? "") : "",
    discount: 0,
    notes: draft?.notes ?? "",
    terms:
      type === "invoice"
        ? (settings?.payment_instructions ?? "")
        : type === "quotation"
          ? (settings?.booking_terms ?? "")
          : "",
    lines,
    links: {
      bookingId: draft?.link.booking_id,
      transferBookingId: draft?.link.transfer_booking_id,
      safariEnquiryId: draft?.link.safari_enquiry_id,
      guestId: draft?.link.guest_id ?? undefined,
    },
  };

  const label = DOCUMENT_LABELS[type];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`New ${label.singular.toLowerCase()}`}
        subtitle={
          draft
            ? `Pre-filled for ${draft.clientName}. Check the lines before issuing.`
            : "Start from a blank document, or create one from a booking, transfer or enquiry."
        }
        back={{ href: "/admin/documents", label: "Documents" }}
      />
      <DocumentEditor values={values} />
    </div>
  );
}

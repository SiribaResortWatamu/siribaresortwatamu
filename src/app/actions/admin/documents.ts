"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import {
  DOCUMENT_LABELS,
  cleanLines,
  computeTotals,
  defaultDueDate,
  isDocumentType,
  paidAgainst,
} from "@/lib/documents";
import { sendMail } from "@/lib/email";
import { formatDate, formatMoney } from "@/lib/format";
import { siteUrl } from "@/lib/env";
import type { BillingDocument } from "@/lib/types";

/**
 * Quotations, invoices and receipts.
 *
 * Drafts are freely editable. Issuing assigns the number and locks the
 * document; the only way to change an issued one is to void it and start
 * again, which keeps the numbering trustworthy.
 */

function textField(value: FormDataEntryValue | null): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

const optionalId = z.preprocess(
  (v) => (typeof v === "string" && v.trim() ? v.trim() : undefined),
  z.uuid().optional(),
);
const optionalDate = z.preprocess(
  (v) => (typeof v === "string" && v.trim() ? v.trim() : undefined),
  z.iso.date("Please choose a valid date").optional(),
);

const saveSchema = z.object({
  id: optionalId,
  docType: z.enum(["quotation", "invoice", "receipt"]),
  clientName: z.string().trim().min(2, "Client name is required").max(160),
  clientEmail: z.union([z.literal(""), z.email("That email does not look right")]).optional(),
  clientPhone: z.string().trim().max(40).optional(),
  clientAddress: z.string().trim().max(400).optional(),
  currency: z.string().trim().min(3).max(3).toUpperCase(),
  issueDate: optionalDate,
  dueDate: optionalDate,
  paymentMethod: z.string().trim().max(80).optional(),
  paymentReference: z.string().trim().max(120).optional(),
  paymentDate: optionalDate,
  bookingId: optionalId,
  transferBookingId: optionalId,
  safariEnquiryId: optionalId,
  guestId: optionalId,
  parentId: optionalId,
});

export async function saveDocument(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = saveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return actionError("Please fix the highlighted fields.", fieldErrors);
  }
  const v = parsed.data;

  let rawLines: unknown = [];
  try {
    rawLines = JSON.parse(String(formData.get("lines") ?? "[]"));
  } catch {
    return actionError("The line items could not be read. Please try again.");
  }
  const lines = cleanLines(rawLines);
  if (lines.length === 0) {
    return actionError("Add at least one line with a description and quantity.", {
      lines: "Add at least one line",
    });
  }

  const totals = computeTotals(lines, Number(formData.get("discount")) || 0);
  if (totals.total <= 0) {
    return actionError("The total must be more than zero.", { lines: "Total must be above zero" });
  }

  const db = supabaseAdmin();

  if (v.id) {
    const { data: existing } = await db
      .from("documents")
      .select("status")
      .eq("id", v.id)
      .maybeSingle();
    if (!existing) return actionError("That document no longer exists.");
    if (existing.status !== "draft") {
      return actionError("Issued documents cannot be edited. Void it and create a new one.");
    }
  }

  const record = {
    client_name: v.clientName,
    client_email: v.clientEmail || null,
    client_phone: v.clientPhone || null,
    client_address: v.clientAddress || null,
    currency: v.currency,
    issue_date: v.issueDate ?? null,
    due_date: v.docType === "receipt" ? null : (v.dueDate ?? null),
    line_items: lines,
    ...totals,
    payment_method: v.docType === "receipt" ? v.paymentMethod || null : null,
    payment_reference: v.docType === "receipt" ? v.paymentReference || null : null,
    payment_date: v.docType === "receipt" ? (v.paymentDate ?? null) : null,
    notes: textField(formData.get("notes")),
    terms: textField(formData.get("terms")),
  };

  if (v.id) {
    const { error } = await db.from("documents").update(record).eq("id", v.id);
    if (error) return actionError(`Could not save: ${error.message}`);
    revalidatePath(`/admin/documents/${v.id}`);
    revalidatePath("/admin/documents");
    return actionSuccess("Draft saved");
  }

  const { data, error } = await db
    .from("documents")
    .insert({
      ...record,
      doc_type: v.docType,
      booking_id: v.bookingId ?? null,
      transfer_booking_id: v.transferBookingId ?? null,
      safari_enquiry_id: v.safariEnquiryId ?? null,
      guest_id: v.guestId ?? null,
      parent_id: v.parentId ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return actionError(`Could not save: ${error?.message ?? "unknown error"}`);

  revalidatePath("/admin/documents");
  redirect(`/admin/documents/${data.id}?created=1`);
}

// =====================================================================
// Issue / void
// =====================================================================
export async function issueDocument(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const db = supabaseAdmin();

  const { data } = await db.from("documents").select("*").eq("id", id).maybeSingle();
  const doc = data as BillingDocument | null;
  if (!doc || doc.status !== "draft") redirect(`/admin/documents/${id}`);

  const { data: number, error } = await db.rpc("next_document_number", {
    p_type: doc.doc_type,
  });
  if (error || !number) {
    throw new Error(`Could not number the document: ${error?.message ?? "no number returned"}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  await db
    .from("documents")
    .update({
      status: "issued",
      number,
      issue_date: doc.issue_date ?? today,
      due_date: doc.due_date ?? defaultDueDate(doc.doc_type),
      payment_date: doc.doc_type === "receipt" ? (doc.payment_date ?? today) : null,
    })
    .eq("id", id)
    .eq("status", "draft");

  revalidatePath(`/admin/documents/${id}`);
  revalidatePath("/admin/documents");
  redirect(`/admin/documents/${id}`);
}

export async function voidDocument(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  await supabaseAdmin()
    .from("documents")
    .update({ status: "void", voided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "issued");

  revalidatePath(`/admin/documents/${id}`);
  revalidatePath("/admin/documents");
  redirect(`/admin/documents/${id}`);
}

/** Drafts were never sent and hold no number, so they can simply go. */
export async function deleteDraft(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  await supabaseAdmin().from("documents").delete().eq("id", id).eq("status", "draft");

  revalidatePath("/admin/documents");
  redirect("/admin/documents");
}

// =====================================================================
// Quotation -> invoice -> receipt
// =====================================================================
export async function createFollowUp(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const to = formData.get("to");
  if (!isDocumentType(to)) redirect(`/admin/documents/${id}`);

  const db = supabaseAdmin();
  const { data } = await db.from("documents").select("*").eq("id", id).maybeSingle();
  const parent = data as BillingDocument | null;
  if (!parent || parent.status !== "issued") redirect(`/admin/documents/${id}`);

  const common = {
    doc_type: to,
    parent_id: parent.id,
    booking_id: parent.booking_id,
    transfer_booking_id: parent.transfer_booking_id,
    safari_enquiry_id: parent.safari_enquiry_id,
    guest_id: parent.guest_id,
    client_name: parent.client_name,
    client_email: parent.client_email,
    client_phone: parent.client_phone,
    client_address: parent.client_address,
    currency: parent.currency,
  };

  let record: Record<string, unknown>;

  if (to === "invoice" && parent.doc_type === "quotation") {
    record = {
      ...common,
      line_items: parent.line_items,
      subtotal: parent.subtotal,
      discount: parent.discount,
      total: parent.total,
      due_date: defaultDueDate("invoice"),
      notes: parent.notes,
      terms: parent.terms,
    };
  } else if (to === "receipt" && parent.doc_type === "invoice") {
    const { data: receipts } = await db
      .from("documents")
      .select("total, status")
      .eq("parent_id", parent.id)
      .eq("doc_type", "receipt");
    const outstanding = Math.max(
      0,
      Number(parent.total) - paidAgainst((receipts ?? []) as BillingDocument[]),
    );

    // One line for the payment, pre-filled with what is still owing. The
    // amount is the thing staff will almost always adjust for a deposit.
    record = {
      ...common,
      line_items: [
        {
          description: `Payment received towards invoice ${parent.number}`,
          quantity: 1,
          unit_price: outstanding,
        },
      ],
      subtotal: outstanding,
      discount: 0,
      total: outstanding,
      payment_date: new Date().toISOString().slice(0, 10),
      notes: parent.notes,
    };
  } else {
    redirect(`/admin/documents/${id}`);
  }

  const { data: created, error } = await db
    .from("documents")
    .insert(record)
    .select("id")
    .single();
  if (error || !created) throw new Error(`Could not create the ${to}: ${error?.message}`);

  revalidatePath("/admin/documents");
  redirect(`/admin/documents/${created.id}?created=1`);
}

// =====================================================================
// Email
// =====================================================================
export async function emailDocument(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const { data } = await supabaseAdmin().from("documents").select("*").eq("id", id).maybeSingle();
  const doc = data as BillingDocument | null;
  if (!doc) return actionError("That document no longer exists.");
  if (doc.status === "draft") return actionError("Issue the document before sending it.");
  if (doc.status === "void") return actionError("This document has been voided.");

  const to = textField(formData.get("to")) ?? doc.client_email;
  if (!to || !to.includes("@")) return actionError("Add an email address to send to.");

  const label = DOCUMENT_LABELS[doc.doc_type].singular;
  const link = `${siteUrl()}/d/${doc.share_token}`;

  const rows = [
    { label: `${label} number`, value: doc.number ?? "" },
    { label: "Amount", value: formatMoney(doc.total, doc.currency) },
  ];
  if (doc.doc_type === "invoice" && doc.due_date) {
    rows.push({ label: "Due", value: formatDate(doc.due_date) });
  }
  if (doc.doc_type === "quotation" && doc.due_date) {
    rows.push({ label: "Valid until", value: formatDate(doc.due_date) });
  }

  const result = await sendMail({
    to,
    subject: `${label} ${doc.number} — Siriba Resort Watamu`,
    heading: `Your ${label.toLowerCase()} from Siriba Resort Watamu`,
    intro: `Hello ${doc.client_name.split(" ")[0]}, your ${label.toLowerCase()} is ready. You can view, print or save it as a PDF from the link below.`,
    rows,
    cta: { label: `View ${label.toLowerCase()}`, href: link },
  });

  if (!result.sent) return actionError(result.error ?? "The email could not be sent.");
  return actionSuccess(`Sent to ${to}`);
}

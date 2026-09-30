import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { BillingDocument } from "@/lib/types";

/**
 * The parent document and the receipts that make a document's balance
 * meaningful: an invoice shows what has been paid against it, and a receipt
 * shows what is left on the invoice it settles.
 */
export async function loadDocumentContext(doc: BillingDocument) {
  const db = supabaseAdmin();

  const { data: parentRow } = doc.parent_id
    ? await db
        .from("documents")
        .select("id, number, doc_type, total")
        .eq("id", doc.parent_id)
        .maybeSingle()
    : { data: null };

  const parent = parentRow as Pick<BillingDocument, "id" | "number" | "doc_type" | "total"> | null;

  const invoiceId =
    doc.doc_type === "invoice" ? doc.id : parent?.doc_type === "invoice" ? parent.id : null;

  const { data: receiptRows } = invoiceId
    ? await db
        .from("documents")
        .select("total, status")
        .eq("parent_id", invoiceId)
        .eq("doc_type", "receipt")
    : { data: [] };

  return {
    parent,
    receipts: (receiptRows ?? []) as Pick<BillingDocument, "total" | "status">[],
  };
}

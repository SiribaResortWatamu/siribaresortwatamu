import Link from "next/link";
import { Panel, StatusPill } from "@/components/admin/ui";
import { DOCUMENT_LABELS } from "@/lib/documents";
import { formatMoney } from "@/lib/format";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { BillingDocument } from "@/lib/types";

const COLUMN = {
  booking: { column: "booking_id", param: "booking" },
  transfer: { column: "transfer_booking_id", param: "transfer" },
  enquiry: { column: "safari_enquiry_id", param: "enquiry" },
} as const;

/**
 * Quotations, invoices and receipts raised from one booking, transfer or
 * enquiry, with shortcuts to make the next one pre-filled from that record.
 */
export async function SourceDocuments({
  kind,
  id,
}: {
  kind: keyof typeof COLUMN;
  id: string;
}) {
  const { column, param } = COLUMN[kind];

  const { data } = await supabaseAdmin()
    .from("documents")
    .select("id, number, doc_type, status, total, currency")
    .eq(column, id)
    .order("created_at", { ascending: false });

  const documents = (data ?? []) as Pick<
    BillingDocument,
    "id" | "number" | "doc_type" | "status" | "total" | "currency"
  >[];

  return (
    <Panel title="Documents" description="Quotes, invoices and receipts for this.">
      <div className="flex flex-wrap gap-2">
        {(["quotation", "invoice", "receipt"] as const).map((type) => (
          <Link
            key={type}
            href={`/admin/documents/new?type=${type}&${param}=${id}`}
            className="btn btn-outline btn-sm"
          >
            {DOCUMENT_LABELS[type].singular}
          </Link>
        ))}
      </div>

      {documents.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-line pt-4">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 text-sm">
              <Link href={`/admin/documents/${doc.id}`} className="hover:text-terracotta">
                {doc.number ?? `Draft ${DOCUMENT_LABELS[doc.doc_type].singular.toLowerCase()}`}
                <span className="ml-2 text-ink-muted">
                  {formatMoney(doc.total, doc.currency, { decimals: false })}
                </span>
              </Link>
              <StatusPill status={doc.status} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

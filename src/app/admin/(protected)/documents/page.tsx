import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusPill,
  Td,
  TableWrap,
  Th,
} from "@/components/admin/ui";
import { DOCUMENT_LABELS, isDocumentType } from "@/lib/documents";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDate, formatMoney } from "@/lib/format";
import { cn, filterTerm } from "@/lib/utils";
import type { BillingDocument } from "@/lib/types";

export const metadata = { title: "Documents" };

const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "quotation", label: "Quotations" },
  { value: "invoice", label: "Invoices" },
  { value: "receipt", label: "Receipts" },
];

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const { type = "", q = "" } = await searchParams;

  let query = supabaseAdmin().from("documents").select("*");
  if (isDocumentType(type)) query = query.eq("doc_type", type);
  if (q.trim()) {
    // Quoted — see filterTerm. A raw term here could inject extra conditions.
    const term = filterTerm(q.trim());
    query = query.or(`client_name.ilike.${term},number.ilike.${term}`);
  }

  const documents = ((await query.order("created_at", { ascending: false }).limit(200)).data ??
    []) as BillingDocument[];

  const href = (next: { type?: string; q?: string }) => {
    const search = new URLSearchParams();
    if (next.type) search.set("type", next.type);
    if (next.q) search.set("q", next.q);
    const s = search.toString();
    return s ? `/admin/documents?${s}` : "/admin/documents";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        subtitle="Quotations, invoices and receipts."
        actions={
          <>
            {(["quotation", "invoice", "receipt"] as const).map((t) => (
              <Link
                key={t}
                href={`/admin/documents/new?type=${t}`}
                className={cn("btn btn-sm", t === "quotation" ? "btn-primary" : "btn-outline")}
              >
                <Plus size={15} strokeWidth={2} />
                {DOCUMENT_LABELS[t].singular}
              </Link>
            ))}
          </>
        }
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_FILTERS.map((option) => (
            <Link
              key={option.value || "all"}
              href={href({ type: option.value, q })}
              className={cn(
                "pill border transition-colors",
                type === option.value
                  ? "border-ocean bg-ocean text-white"
                  : "border-line bg-white text-ink-muted hover:border-ink hover:text-ink",
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>

        <form className="flex max-w-md gap-2" action="/admin/documents">
          {type && <input type="hidden" name="type" value={type} />}
          <input
            name="q"
            defaultValue={q}
            className="input"
            placeholder="Search client or number…"
            aria-label="Search documents"
          />
          <button type="submit" className="btn btn-outline btn-sm shrink-0">
            <Search size={14} strokeWidth={1.75} />
            Search
          </button>
        </form>
      </div>

      <Panel bodyClassName="">
        {documents.length === 0 ? (
          <EmptyState
            icon={<FileText size={20} strokeWidth={1.4} />}
            title="No documents yet"
            description={
              q
                ? `Nothing found for “${q}”.`
                : "Create one here, or from a booking, transfer or enquiry."
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Number</Th>
                <Th>Type</Th>
                <Th>Client</Th>
                <Th>Date</Th>
                <Th align="right">Total</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <Td className="whitespace-nowrap font-medium tabular-nums">
                    <Link
                      href={`/admin/documents/${doc.id}`}
                      className="transition-colors hover:text-terracotta"
                    >
                      {doc.number ?? "Draft"}
                    </Link>
                  </Td>
                  <Td className="text-sm">{DOCUMENT_LABELS[doc.doc_type].singular}</Td>
                  <Td>
                    <span className="block font-medium">{doc.client_name}</span>
                    {doc.client_email && (
                      <span className="block truncate text-xs text-ink-muted">
                        {doc.client_email}
                      </span>
                    )}
                  </Td>
                  <Td className="text-sm whitespace-nowrap">
                    {formatDate(doc.issue_date ?? doc.created_at.slice(0, 10))}
                  </Td>
                  <Td align="right" className="text-sm whitespace-nowrap">
                    {formatMoney(doc.total, doc.currency, { decimals: false })}
                  </Td>
                  <Td>
                    <StatusPill status={doc.status} />
                  </Td>
                  <Td align="right">
                    <Link
                      href={`/admin/documents/${doc.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      Open
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
}

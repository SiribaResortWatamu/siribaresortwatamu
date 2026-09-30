import { DOCUMENT_LABELS, lineTotal, paidAgainst } from "@/lib/documents";
import { formatDate, formatMoney } from "@/lib/format";
import { resolveImage } from "@/lib/images";
import type { BillingDocument, SiteSettings } from "@/lib/types";

/**
 * The printable document. Plain markup and a fixed sheet width, so the
 * browser's "Save as PDF" produces the same page a guest sees on screen.
 * Colours are kept to the brand palette but every block also reads fine in
 * black and white.
 */
export function DocumentSheet({
  doc,
  settings,
  parent,
  receipts,
}: {
  doc: BillingDocument;
  settings: Pick<
    SiteSettings,
    "property_name" | "address" | "phone" | "email" | "logo_path" | "tagline"
  >;
  /** The document this one was raised from, when there is one. */
  parent: Pick<BillingDocument, "number" | "doc_type" | "total"> | null;
  /** Issued receipts against this invoice (or against this receipt's invoice). */
  receipts: Pick<BillingDocument, "total" | "status">[];
}) {
  const label = DOCUMENT_LABELS[doc.doc_type];
  const logo = resolveImage(settings.logo_path) ?? "/logo.png";
  const money = (n: number) => formatMoney(n, doc.currency, { decimals: true });

  const paid = paidAgainst(receipts);
  const invoiceTotal =
    doc.doc_type === "invoice"
      ? Number(doc.total)
      : parent?.doc_type === "invoice"
        ? Number(parent.total)
        : null;
  const balance =
    invoiceTotal === null ? null : Math.max(0, Math.round((invoiceTotal - paid) * 100) / 100);

  const dateLabel =
    doc.doc_type === "quotation" ? "Valid until" : doc.doc_type === "invoice" ? "Due" : null;

  return (
    <article className="relative mx-auto w-full max-w-[820px] bg-white p-8 text-[0.9rem] leading-relaxed text-ink shadow-sm sm:p-12 print:max-w-none print:p-0 print:shadow-none">
      {doc.status === "void" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="-rotate-12 rounded-xl border-4 border-[#a3402c]/40 px-8 py-2 font-display text-6xl font-semibold tracking-widest text-[#a3402c]/30">
            VOID
          </span>
        </div>
      )}

      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-8">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={settings.property_name} className="h-16 w-auto" />
          <p className="mt-4 font-display text-lg font-semibold">{settings.property_name}</p>
          <div className="mt-1 text-ink-muted">
            {settings.address && <p>{settings.address}</p>}
            {settings.phone && <p>{settings.phone}</p>}
            {settings.email && <p>{settings.email}</p>}
          </div>
        </div>

        <div className="text-right">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ocean">
            {label.singular}
          </h1>
          <p className="mt-2 text-lg font-medium tabular-nums">
            {doc.number ?? <span className="text-ink-muted">Draft</span>}
          </p>
          {doc.status === "draft" && (
            <p className="mt-1 text-xs tracking-widest text-terracotta uppercase">
              Not yet issued
            </p>
          )}
        </div>
      </header>

      <section className="grid gap-8 border-b border-line py-8 sm:grid-cols-2">
        <div>
          <p className="text-[0.7rem] tracking-[0.12em] text-ink-muted uppercase">
            {doc.doc_type === "receipt" ? "Received from" : "Billed to"}
          </p>
          <p className="mt-2 font-medium">{doc.client_name}</p>
          <div className="text-ink-muted">
            {doc.client_address && <p className="whitespace-pre-line">{doc.client_address}</p>}
            {doc.client_email && <p>{doc.client_email}</p>}
            {doc.client_phone && <p>{doc.client_phone}</p>}
          </div>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 sm:justify-self-end">
          <dt className="text-ink-muted">Date</dt>
          <dd className="text-right">{formatDate(doc.issue_date)}</dd>
          {dateLabel && doc.due_date && (
            <>
              <dt className="text-ink-muted">{dateLabel}</dt>
              <dd className="text-right">{formatDate(doc.due_date)}</dd>
            </>
          )}
          {parent?.number && (
            <>
              <dt className="text-ink-muted">{DOCUMENT_LABELS[parent.doc_type].singular}</dt>
              <dd className="text-right tabular-nums">{parent.number}</dd>
            </>
          )}
          {doc.doc_type === "receipt" && (
            <>
              <dt className="text-ink-muted">Payment date</dt>
              <dd className="text-right">{formatDate(doc.payment_date)}</dd>
              {doc.payment_method && (
                <>
                  <dt className="text-ink-muted">Method</dt>
                  <dd className="text-right">{doc.payment_method}</dd>
                </>
              )}
              {doc.payment_reference && (
                <>
                  <dt className="text-ink-muted">Reference</dt>
                  <dd className="text-right">{doc.payment_reference}</dd>
                </>
              )}
            </>
          )}
        </dl>
      </section>

      <table className="mt-8 w-full border-collapse">
        <thead>
          <tr className="border-b border-ink/70 text-left text-[0.7rem] tracking-[0.1em] text-ink-muted uppercase">
            <th className="pb-2.5 font-medium">Description</th>
            <th className="w-16 pb-2.5 text-right font-medium">Qty</th>
            <th className="w-32 pb-2.5 text-right font-medium">Unit price</th>
            <th className="w-32 pb-2.5 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {doc.line_items.map((line, index) => (
            <tr key={index} className="border-b border-line align-top">
              <td className="py-3 pr-4">{line.description}</td>
              <td className="py-3 text-right tabular-nums">{line.quantity}</td>
              <td className="py-3 text-right whitespace-nowrap tabular-nums">
                {money(line.unit_price)}
              </td>
              <td className="py-3 text-right whitespace-nowrap tabular-nums">
                {money(lineTotal(line))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 ml-auto w-full max-w-xs space-y-1.5">
        {Number(doc.discount) > 0 && (
          <>
            <Row label="Subtotal" value={money(Number(doc.subtotal))} />
            <Row label="Discount" value={`− ${money(Number(doc.discount))}`} />
          </>
        )}
        <div className="flex items-baseline justify-between gap-6 border-t border-ink/70 pt-2.5">
          <span className="font-medium">
            {doc.doc_type === "receipt" ? "Amount received" : "Total"}
          </span>
          <span className="font-display text-xl font-semibold tabular-nums">
            {money(Number(doc.total))}
          </span>
        </div>

        {doc.doc_type === "invoice" && paid > 0 && (
          <>
            <Row label="Paid to date" value={`− ${money(paid)}`} />
            <Row label="Balance due" value={money(balance ?? 0)} strong />
          </>
        )}
        {doc.doc_type === "receipt" && balance !== null && (
          <Row
            label="Invoice balance"
            value={balance > 0 ? money(balance) : "Settled in full"}
            strong
          />
        )}
      </div>

      {(doc.notes || doc.terms) && (
        <section className="mt-10 grid gap-6 border-t border-line pt-6 text-[0.82rem]">
          {doc.notes && (
            <div>
              <p className="text-[0.7rem] tracking-[0.12em] text-ink-muted uppercase">Notes</p>
              <p className="mt-1.5 whitespace-pre-line text-ink-muted">{doc.notes}</p>
            </div>
          )}
          {doc.terms && (
            <div>
              <p className="text-[0.7rem] tracking-[0.12em] text-ink-muted uppercase">
                {doc.doc_type === "invoice" ? "How to pay" : "Terms"}
              </p>
              <p className="mt-1.5 whitespace-pre-line text-ink-muted">{doc.terms}</p>
            </div>
          )}
        </section>
      )}

      <footer className="mt-12 border-t border-line pt-5 text-center text-xs text-ink-muted">
        {doc.doc_type === "receipt"
          ? `Thank you for your payment — ${settings.property_name}`
          : `Thank you for choosing ${settings.property_name}`}
      </footer>
    </article>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <span className={strong ? "font-medium" : "text-ink-muted"}>{label}</span>
      <span className={`tabular-nums ${strong ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { WhatsAppIcon } from "@/components/icons";
import { PageHeader, Panel, StatusPill } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/form";
import { CopyField } from "@/components/admin/copy-field";
import { DocumentSendPanel } from "@/components/admin/document-send-panel";
import { DownloadButton } from "@/components/documents/download-button";
import { DocumentEditor, type EditorValues } from "@/components/admin/document-editor";
import { DocumentSheet } from "@/components/documents/document-sheet";
import {
  createFollowUp,
  deleteDraft,
  issueDocument,
  voidDocument,
} from "@/app/actions/admin/documents";
import { DOCUMENT_LABELS, paidAgainst } from "@/lib/documents";
import { loadDocumentContext } from "@/lib/data/documents";
import { getSettings } from "@/lib/data/settings";
import { siteUrl } from "@/lib/env";
import { formatDate, formatMoney } from "@/lib/format";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { whatsappLink } from "@/lib/whatsapp";
import type { BillingDocument } from "@/lib/types";

export const metadata = { title: "Document" };

export default async function DocumentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();

  const db = supabaseAdmin();
  const { data } = await db.from("documents").select("*").eq("id", id).maybeSingle();
  const doc = data as BillingDocument | null;
  if (!doc) notFound();

  const [settings, context, { data: childRows }] = await Promise.all([
    getSettings(),
    loadDocumentContext(doc),
    db
      .from("documents")
      .select("id, number, doc_type, status, total, currency")
      .eq("parent_id", doc.id)
      .order("created_at"),
  ]);
  if (!settings) notFound();

  const children = (childRows ?? []) as Pick<
    BillingDocument,
    "id" | "number" | "doc_type" | "status" | "total" | "currency"
  >[];

  const label = DOCUMENT_LABELS[doc.doc_type];
  const title = doc.number ?? `Draft ${label.singular.toLowerCase()}`;
  const shareUrl = `${siteUrl()}/d/${doc.share_token}`;
  const wa = whatsappLink(
    doc.client_phone,
    `Hello ${doc.client_name.split(" ")[0]}, here is your ${label.singular.toLowerCase()} ${doc.number ?? ""} from ${settings.property_name}: ${shareUrl}`,
  );

  const dueLine =
    doc.due_date && doc.doc_type !== "receipt"
      ? `${doc.doc_type === "quotation" ? "Valid until" : "Payment due"}: ${formatDate(doc.due_date)}`
      : null;
  const emailMessage = [
    `Hello ${doc.client_name.split(" ")[0]},`,
    "",
    `Please find your ${label.singular.toLowerCase()} ${doc.number ?? ""} from ${settings.property_name} for ${formatMoney(doc.total, doc.currency)}.`,
    ...(dueLine ? [dueLine] : []),
    "",
    "You can view it and download the PDF here:",
    shareUrl,
    "",
    "Kind regards,",
    settings.property_name,
  ].join("\n");

  const source = doc.booking_id
    ? { href: `/admin/bookings/${doc.booking_id}`, label: "Booking" }
    : doc.transfer_booking_id
      ? { href: `/admin/transfers/requests/${doc.transfer_booking_id}`, label: "Transfer request" }
      : doc.safari_enquiry_id
        ? { href: `/admin/safaris/enquiries/${doc.safari_enquiry_id}`, label: "Enquiry" }
        : null;

  const back = { href: "/admin/documents", label: "Documents" };

  // ---------------------------------------------------------------------
  // Draft: editable, with the issue / discard controls
  // ---------------------------------------------------------------------
  if (doc.status === "draft") {
    const values: EditorValues = {
      id: doc.id,
      docType: doc.doc_type,
      clientName: doc.client_name,
      clientEmail: doc.client_email ?? "",
      clientPhone: doc.client_phone ?? "",
      clientAddress: doc.client_address ?? "",
      currency: doc.currency,
      issueDate: doc.issue_date ?? "",
      dueDate: doc.due_date ?? "",
      paymentMethod: doc.payment_method ?? "",
      paymentReference: doc.payment_reference ?? "",
      paymentDate: doc.payment_date ?? "",
      discount: Number(doc.discount),
      notes: doc.notes ?? "",
      terms: doc.terms ?? "",
      lines: doc.line_items,
      links: {},
    };

    return (
      <div className="space-y-6">
        <PageHeader
          title={title}
          subtitle={`${doc.client_name} · ${formatMoney(doc.total, doc.currency)}`}
          back={back}
          actions={<StatusPill status={doc.status} />}
        />

        {created && (
          <p className="rounded-xl bg-[#dff0e4] px-4 py-3.5 text-sm text-[#1f6b3a]">
            Draft created. Review it, then issue it to give it a number.
          </p>
        )}

        {/* Below xl the two columns stack, and the Issue panel goes first so it
            is not buried under a long form. */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
          <DocumentEditor values={values} />

          <div className="order-first space-y-6 xl:order-none">
            <Panel
              title="Issue"
              description="Issuing assigns the number and locks the document. It cannot be edited afterwards."
            >
              <div className="flex flex-wrap gap-2">
                <form action={issueDocument}>
                  <input type="hidden" name="id" value={doc.id} />
                  <SubmitButton confirm={`Issue this ${label.singular.toLowerCase()}? It will be numbered and locked.`}>
                    Issue {label.singular.toLowerCase()}
                  </SubmitButton>
                </form>
                <form action={deleteDraft}>
                  <input type="hidden" name="id" value={doc.id} />
                  <SubmitButton variant="danger" confirm="Delete this draft?">
                    Delete draft
                  </SubmitButton>
                </form>
              </div>
              <p className="mt-3 text-xs text-ink-muted">
                Save any changes to the form before issuing.
              </p>
            </Panel>
            {source && (
              <Link href={source.href} className="btn btn-outline btn-sm">
                View {source.label.toLowerCase()}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------
  // Issued or void: read-only preview and the things you do next
  // ---------------------------------------------------------------------
  const receiptsPaid = paidAgainst(context.receipts);
  const outstanding = doc.doc_type === "invoice" ? Number(doc.total) - receiptsPaid : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={`${doc.client_name} · ${formatMoney(doc.total, doc.currency)}`}
        back={back}
        actions={<StatusPill status={doc.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div className="min-w-0 overflow-x-auto rounded-2xl border border-line bg-white">
          <DocumentSheet doc={doc} settings={settings} {...context} />
        </div>

        <div className="order-first space-y-6 xl:order-none">
          <Panel title="Share">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <DownloadButton token={doc.share_token} />
                {wa && doc.status === "issued" && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-whatsapp btn-sm"
                  >
                    <WhatsAppIcon size={14} />
                    WhatsApp
                  </a>
                )}
              </div>
              <CopyField label="Client link" value={shareUrl} />
              {doc.status === "issued" && (
                <DocumentSendPanel
                  email={doc.client_email ?? ""}
                  subject={`${label.singular} ${doc.number} from ${settings.property_name}`}
                  message={emailMessage}
                />
              )}
            </div>
          </Panel>

          {doc.status === "issued" && (
            <Panel title="What next?">
              <div className="space-y-4">
                {doc.doc_type === "quotation" && (
                  <FollowUp id={doc.id} to="invoice" label="Convert to invoice" />
                )}
                {doc.doc_type === "invoice" && (
                  <>
                    <p className="text-sm text-ink-muted">
                      {outstanding > 0
                        ? `${formatMoney(outstanding, doc.currency)} outstanding.`
                        : "Paid in full."}
                    </p>
                    {outstanding > 0 && (
                      <FollowUp id={doc.id} to="receipt" label="Record payment (create receipt)" />
                    )}
                  </>
                )}
                <form action={voidDocument}>
                  <input type="hidden" name="id" value={doc.id} />
                  <SubmitButton
                    variant="danger"
                    confirm={`Void ${doc.number}? It stays on record, marked void, and cannot be reversed.`}
                  >
                    Void {label.singular.toLowerCase()}
                  </SubmitButton>
                </form>
              </div>
            </Panel>
          )}

          {(source || context.parent || children.length > 0) && (
            <Panel title="Related">
              <ul className="space-y-2 text-sm">
                {source && (
                  <li>
                    <Link href={source.href} className="hover:text-terracotta">
                      {source.label} →
                    </Link>
                  </li>
                )}
                {context.parent && (
                  <li>
                    <Link
                      href={`/admin/documents/${context.parent.id}`}
                      className="hover:text-terracotta"
                    >
                      From {DOCUMENT_LABELS[context.parent.doc_type].singular.toLowerCase()}{" "}
                      {context.parent.number} →
                    </Link>
                  </li>
                )}
                {children.map((child) => (
                  <li key={child.id} className="flex items-center justify-between gap-3">
                    <Link
                      href={`/admin/documents/${child.id}`}
                      className="hover:text-terracotta"
                    >
                      {child.number ?? `Draft ${DOCUMENT_LABELS[child.doc_type].singular.toLowerCase()}`}{" "}
                      · {formatMoney(child.total, child.currency)}
                    </Link>
                    <StatusPill status={child.status} />
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function FollowUp({ id, to, label }: { id: string; to: string; label: string }) {
  return (
    <form action={createFollowUp}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="to" value={to} />
      <SubmitButton variant="ocean">{label}</SubmitButton>
    </form>
  );
}

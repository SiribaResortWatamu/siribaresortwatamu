import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { DOCUMENT_LABELS, invoiceBalance, lineTotal } from "@/lib/documents";
import { formatDate, formatMoney } from "@/lib/format";
import { resolveImage } from "@/lib/images";
import type { BillingDocument, SiteSettings } from "@/lib/types";

/**
 * The downloadable document.
 *
 * Always A4. The content flows, so a long quotation simply continues onto
 * further pages rather than being squeezed or clipped: rows and the totals
 * block are kept whole, and every page carries a footer with its number.
 *
 * It mirrors the on-screen sheet (`DocumentSheet`) but is laid out with the
 * PDF primitives, because a PDF cannot render HTML. The built-in Helvetica
 * is used so no font files have to be shipped or fetched.
 */

const INK = "#26241f";
const MUTED = "#6b6459";
const LINE = "#e0d6c6";
const OCEAN = "#2c6e6b";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: INK,
    lineHeight: 1.45,
    paddingTop: 44,
    paddingBottom: 64,
    paddingHorizontal: 44,
  },
  row: { flexDirection: "row" },
  between: { flexDirection: "row", justifyContent: "space-between" },
  muted: { color: MUTED },
  label: {
    fontSize: 7.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: MUTED,
    marginBottom: 4,
  },
  header: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    lineHeight: 1.2,
    color: OCEAN,
    textAlign: "right",
  },
  number: { fontSize: 12, lineHeight: 1.3, marginTop: 4, textAlign: "right" },
  property: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    lineHeight: 1.3,
    marginTop: 10,
    marginBottom: 2,
  },
  meta: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: LINE },
  metaRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 3 },
  metaKey: { width: 80, color: MUTED },
  metaValue: { width: 96, textAlign: "right" },
  tableHead: {
    flexDirection: "row",
    marginTop: 22,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: INK,
  },
  th: { fontSize: 7.5, letterSpacing: 1, textTransform: "uppercase", color: MUTED },
  tr: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  colDesc: { flexGrow: 1, flexBasis: 0, paddingRight: 10 },
  colQty: { width: 36, textAlign: "right" },
  colUnit: { width: 86, textAlign: "right" },
  colAmount: { width: 92, textAlign: "right" },
  totals: { marginTop: 14, alignSelf: "flex-end", width: 230 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  grand: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: INK,
    paddingTop: 8,
    marginTop: 4,
  },
  grandValue: { fontFamily: "Helvetica-Bold", fontSize: 15, lineHeight: 1.2 },
  bold: { fontFamily: "Helvetica-Bold" },
  notes: { marginTop: 28, paddingTop: 14, borderTopWidth: 1, borderTopColor: LINE },
  footerRule: {
    position: "absolute",
    bottom: 46,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: LINE,
  },
  footerLeft: { position: "absolute", bottom: 28, left: 44, fontSize: 8, color: MUTED },
  // Anchored from the top, not the bottom: the engine measures page-number text
  // as zero-height while it resolves it, which would push a bottom-anchored
  // element off the page. A4 is 595 x 842pt; this box ends at the 44pt margin.
  footerRight: {
    position: "absolute",
    top: 800,
    left: 301,
    width: 250,
    fontSize: 8,
    color: MUTED,
    textAlign: "right",
  },
  void: {
    position: "absolute",
    top: 330,
    left: 90,
    fontFamily: "Helvetica-Bold",
    fontSize: 110,
    color: "#f4dcd6",
    transform: "rotate(-20deg)",
  },
});

interface Logo {
  data: Buffer;
  format: "png" | "jpg";
  width: number;
  height: number;
}

/**
 * The property logo as bytes. PDF images cannot be fetched lazily, so it is
 * read here: from `public/` for the bundled default, over HTTP for an
 * uploaded one. A logo that cannot be read is skipped — the document is
 * still complete without it.
 */
async function loadLogo(logoPath: string | null): Promise<Logo | null> {
  try {
    const source = resolveImage(logoPath) ?? "/logo.png";
    const data = source.startsWith("/")
      ? await readFile(join(process.cwd(), "public", source))
      : Buffer.from(await (await fetch(source)).arrayBuffer());

    const isPng = data[0] === 0x89 && data[1] === 0x50;
    const isJpg = data[0] === 0xff && data[1] === 0xd8;
    if (!isPng && !isJpg) return null; // e.g. SVG, which PDF images do not support

    // Only PNG carries its size at a fixed offset; assume a wide mark otherwise.
    const ratio = isPng ? data.readUInt32BE(16) / data.readUInt32BE(20) : 3;
    const height = 42;
    return { data, format: isPng ? "png" : "jpg", width: height * ratio, height };
  } catch {
    return null;
  }
}

/** Standard PDF fonts cover Latin-1 only, so a real minus sign is swapped. */
const money = (value: number, currency: string) => formatMoney(value, currency, { decimals: true });

type Settings = Pick<SiteSettings, "property_name" | "address" | "phone" | "email" | "logo_path">;

export interface DocumentPdfInput {
  doc: BillingDocument;
  settings: Settings;
  parent: Pick<BillingDocument, "number" | "doc_type" | "total"> | null;
  receipts: Pick<BillingDocument, "total" | "status">[];
}

export async function renderDocumentPdf(input: DocumentPdfInput): Promise<Buffer> {
  const logo = await loadLogo(input.settings.logo_path);
  return renderToBuffer(<DocumentPdf {...input} logo={logo} />);
}

/** A file name a person would recognise, safe on every operating system. */
export function documentFileName(doc: Pick<BillingDocument, "doc_type" | "number">): string {
  const base = doc.number ?? `draft-${doc.doc_type}`;
  return `${base.replace(/[^A-Za-z0-9._-]/g, "-")}.pdf`;
}

function DocumentPdf({
  doc,
  settings,
  parent,
  receipts,
  logo,
}: DocumentPdfInput & { logo: Logo | null }) {
  const label = DOCUMENT_LABELS[doc.doc_type];
  const { paid, balance } = invoiceBalance(doc, parent, receipts);
  const dateLabel =
    doc.doc_type === "quotation" ? "Valid until" : doc.doc_type === "invoice" ? "Due" : null;

  const meta: [string, string][] = [["Date", formatDate(doc.issue_date)]];
  if (dateLabel && doc.due_date) meta.push([dateLabel, formatDate(doc.due_date)]);
  if (parent?.number) meta.push([DOCUMENT_LABELS[parent.doc_type].singular, parent.number]);
  if (doc.doc_type === "receipt") {
    meta.push(["Payment date", formatDate(doc.payment_date)]);
    if (doc.payment_method) meta.push(["Method", doc.payment_method]);
    if (doc.payment_reference) meta.push(["Reference", doc.payment_reference]);
  }

  return (
    <Document
      title={`${label.singular} ${doc.number ?? "(draft)"}`}
      author={settings.property_name}
      subject={`${label.singular} for ${doc.client_name}`}
    >
      <Page size="A4" style={styles.page}>
        <View fixed style={styles.footerRule} />
        <Text fixed style={styles.footerLeft}>
          {doc.doc_type === "receipt"
            ? `Thank you for your payment - ${settings.property_name}`
            : `Thank you for choosing ${settings.property_name}`}
        </Text>
        <Text
          fixed
          style={styles.footerRight}
          render={({ pageNumber, totalPages }) =>
            `${doc.number ?? label.singular} - Page ${pageNumber} of ${totalPages}`
          }
        />
        {doc.status === "void" && <Text fixed style={styles.void}>VOID</Text>}

        <View style={[styles.between, styles.header]}>
          <View>
            {logo && (
              // react-pdf's Image has no alt attribute, so the a11y rule does not apply.
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image
                src={{ data: logo.data, format: logo.format }}
                style={{ width: logo.width, height: logo.height }}
              />
            )}
            <Text style={styles.property}>{settings.property_name}</Text>
            {settings.address && <Text style={styles.muted}>{settings.address}</Text>}
            {settings.phone && <Text style={styles.muted}>{settings.phone}</Text>}
            {settings.email && <Text style={styles.muted}>{settings.email}</Text>}
          </View>
          <View>
            <Text style={styles.title}>{label.singular}</Text>
            <Text style={styles.number}>{doc.number ?? "Draft"}</Text>
            {doc.status === "draft" && (
              <Text style={{ fontSize: 8, color: "#c1694f", textAlign: "right", marginTop: 3 }}>
                NOT YET ISSUED
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.between, styles.meta]}>
          <View style={{ maxWidth: 260 }}>
            <Text style={styles.label}>
              {doc.doc_type === "receipt" ? "Received from" : "Billed to"}
            </Text>
            <Text style={styles.bold}>{doc.client_name}</Text>
            {doc.client_address && <Text style={styles.muted}>{doc.client_address}</Text>}
            {doc.client_email && <Text style={styles.muted}>{doc.client_email}</Text>}
            {doc.client_phone && <Text style={styles.muted}>{doc.client_phone}</Text>}
          </View>
          <View>
            {meta.map(([key, value]) => (
              <View key={key} style={styles.metaRow}>
                <Text style={styles.metaKey}>{key}</Text>
                <Text style={styles.metaValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.tableHead}>
          <Text style={[styles.th, styles.colDesc]}>Description</Text>
          <Text style={[styles.th, styles.colQty]}>Qty</Text>
          <Text style={[styles.th, styles.colUnit]}>Unit price</Text>
          <Text style={[styles.th, styles.colAmount]}>Amount</Text>
        </View>
        {doc.line_items.map((line, index) => (
          // A row is never split across two pages.
          <View key={index} style={styles.tr} wrap={false}>
            <Text style={styles.colDesc}>{line.description}</Text>
            <Text style={styles.colQty}>{String(line.quantity)}</Text>
            <Text style={styles.colUnit}>{money(line.unit_price, doc.currency)}</Text>
            <Text style={styles.colAmount}>{money(lineTotal(line), doc.currency)}</Text>
          </View>
        ))}

        <View style={styles.totals} wrap={false}>
          {Number(doc.discount) > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.muted}>Subtotal</Text>
                <Text>{money(Number(doc.subtotal), doc.currency)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.muted}>Discount</Text>
                <Text>- {money(Number(doc.discount), doc.currency)}</Text>
              </View>
            </>
          )}
          <View style={styles.grand}>
            <Text style={styles.bold}>
              {doc.doc_type === "receipt" ? "Amount received" : "Total"}
            </Text>
            <Text style={styles.grandValue}>{money(Number(doc.total), doc.currency)}</Text>
          </View>
          {doc.doc_type === "invoice" && paid > 0 && (
            <>
              <View style={[styles.totalRow, { marginTop: 6 }]}>
                <Text style={styles.muted}>Paid to date</Text>
                <Text>- {money(paid, doc.currency)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.bold}>Balance due</Text>
                <Text style={styles.bold}>{money(balance ?? 0, doc.currency)}</Text>
              </View>
            </>
          )}
          {doc.doc_type === "receipt" && balance !== null && (
            <View style={[styles.totalRow, { marginTop: 6 }]}>
              <Text style={styles.bold}>Invoice balance</Text>
              <Text style={styles.bold}>
                {balance > 0 ? money(balance, doc.currency) : "Settled in full"}
              </Text>
            </View>
          )}
        </View>

        {(doc.notes || doc.terms) && (
          <View style={styles.notes}>
            {doc.notes && (
              <View style={{ marginBottom: doc.terms ? 12 : 0 }}>
                <Text style={styles.label}>Notes</Text>
                <Text style={styles.muted}>{doc.notes}</Text>
              </View>
            )}
            {doc.terms && (
              <View>
                <Text style={styles.label}>
                  {doc.doc_type === "invoice" ? "How to pay" : "Terms"}
                </Text>
                <Text style={styles.muted}>{doc.terms}</Text>
              </View>
            )}
          </View>
        )}

      </Page>
    </Document>
  );
}

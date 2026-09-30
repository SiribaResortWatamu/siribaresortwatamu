import { z } from "zod";
import { loadDocumentContext } from "@/lib/data/documents";
import { getSettings } from "@/lib/data/settings";
import { documentFileName, renderDocumentPdf } from "@/lib/documents-pdf";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { BillingDocument } from "@/lib/types";

export const dynamic = "force-dynamic";
// The PDF engine needs Node, not the edge runtime.
export const runtime = "nodejs";

/**
 * The document as an A4 PDF download. Like the page it belongs to, the
 * unguessable token in the URL is the only credential.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!z.uuid().safeParse(token).success) return new Response("Not found", { status: 404 });

  const { data } = await supabaseAdmin()
    .from("documents")
    .select("*")
    .eq("share_token", token)
    .maybeSingle();
  const doc = data as BillingDocument | null;
  if (!doc) return new Response("Not found", { status: 404 });

  const [settings, context] = await Promise.all([getSettings(), loadDocumentContext(doc)]);
  if (!settings) return new Response("Not found", { status: 404 });

  try {
    const pdf = await renderDocumentPdf({ doc, settings, ...context });
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${documentFileName(doc)}"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    console.error("[documents] pdf render failed", error);
    return new Response("The PDF could not be created.", { status: 500 });
  }
}

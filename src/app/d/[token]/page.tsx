import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { DocumentSheet } from "@/components/documents/document-sheet";
import { DownloadButton } from "@/components/documents/download-button";
import { loadDocumentContext } from "@/lib/data/documents";
import { getSettings } from "@/lib/data/settings";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { BillingDocument } from "@/lib/types";

/**
 * A document as the client sees it. The unguessable token in the URL is the
 * only credential, so the page is kept out of search results and never
 * cached.
 */
export const metadata: Metadata = {
  title: "Document",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SharedDocumentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!z.uuid().safeParse(token).success) notFound();

  const { data } = await supabaseAdmin()
    .from("documents")
    .select("*")
    .eq("share_token", token)
    .maybeSingle();
  const doc = data as BillingDocument | null;
  if (!doc) notFound();

  const [settings, context] = await Promise.all([getSettings(), loadDocumentContext(doc)]);
  if (!settings) notFound();

  return (
    <>
      <div className="min-h-screen bg-sand px-4 py-8 print:hidden">
        <div className="mx-auto mb-5 flex max-w-[820px] justify-end">
          <DownloadButton token={doc.share_token} />
        </div>
        <DocumentSheet doc={doc} settings={settings} {...context} />
      </div>
      {/* Printing the page is switched off: the PDF is the copy to keep. */}
      <p className="hidden p-10 text-center text-sm print:block">
        Please use the Download PDF button to save this document.
      </p>
    </>
  );
}

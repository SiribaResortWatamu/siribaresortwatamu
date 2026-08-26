import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, StatusPill } from "@/components/admin/ui";
import { TransferForm } from "@/components/admin/transfer-form";
import { SubmitButton } from "@/components/admin/form";
import { setContentStatus } from "@/app/actions/admin/content";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { TransferWithPhotos } from "@/lib/types";

export const metadata = { title: "Edit Transfer Service" };

export default async function EditTransferPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;

  const { data } = await supabaseAdmin()
    .from("transfer_services")
    .select("*, transfer_photos(*)")
    .eq("id", id)
    .maybeSingle();

  const transfer = data as TransferWithPhotos | null;
  if (!transfer) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={transfer.name}
        subtitle={`/transfers/${transfer.slug}`}
        back={{ href: "/admin/transfers", label: "Transfers" }}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill status={transfer.status} />
            {transfer.status === "published" ? (
              <StatusForm id={transfer.id} status="hidden" label="Unpublish" />
            ) : (
              transfer.status !== "archived" && (
                <StatusForm id={transfer.id} status="published" label="Publish" />
              )
            )}
            {transfer.status !== "archived" && (
              <StatusForm
                id={transfer.id}
                status="archived"
                label="Archive"
                variant="danger"
                confirm="Archive this service? Past transfer requests keep their details."
              />
            )}
          </div>
        }
      />

      {created && (
        <p className="rounded-xl bg-[#dff0e4] px-4 py-3.5 text-sm text-[#1f6b3a]">
          Created. Set the status to Published and it appears at{" "}
          <Link href={`/transfers/${transfer.slug}`} className="underline">
            /transfers/{transfer.slug}
          </Link>
          .
        </p>
      )}

      <TransferForm transfer={transfer} />
    </div>
  );
}

function StatusForm({
  id,
  status,
  label,
  variant = "outline",
  confirm,
}: {
  id: string;
  status: string;
  label: string;
  variant?: "outline" | "danger";
  confirm?: string;
}) {
  return (
    <form action={setContentStatus}>
      <input type="hidden" name="kind" value="transfers" />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton variant={variant} confirm={confirm}>
        {label}
      </SubmitButton>
    </form>
  );
}

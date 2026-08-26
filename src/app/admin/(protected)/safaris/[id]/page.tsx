import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, StatusPill } from "@/components/admin/ui";
import { SafariForm } from "@/components/admin/safari-form";
import { SubmitButton } from "@/components/admin/form";
import { setContentStatus } from "@/app/actions/admin/content";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { SafariWithDetail } from "@/lib/types";

export const metadata = { title: "Edit Safari" };

export default async function EditSafariPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;

  const { data } = await supabaseAdmin()
    .from("safari_packages")
    .select("*, safari_photos(*), safari_itinerary_days(*)")
    .eq("id", id)
    .maybeSingle();

  const safari = data as SafariWithDetail | null;
  if (!safari) notFound();

  safari.safari_itinerary_days = [...(safari.safari_itinerary_days ?? [])].sort(
    (a, b) => a.display_order - b.display_order || a.day_number - b.day_number,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={safari.name}
        subtitle={`/safaris/${safari.slug}`}
        back={{ href: "/admin/safaris", label: "Safaris" }}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill status={safari.status} />
            {safari.status === "published" ? (
              <StatusForm id={safari.id} status="hidden" label="Unpublish" />
            ) : (
              safari.status !== "archived" && (
                <StatusForm id={safari.id} status="published" label="Publish" />
              )
            )}
            {safari.status !== "archived" && (
              <StatusForm
                id={safari.id}
                status="archived"
                label="Archive"
                variant="danger"
                confirm="Archive this safari? Existing enquiries keep their details."
              />
            )}
          </div>
        }
      />

      {created && (
        <p className="rounded-xl bg-[#dff0e4] px-4 py-3.5 text-sm text-[#1f6b3a]">
          Created. Set the status to Published and it appears at{" "}
          <Link href={`/safaris/${safari.slug}`} className="underline">
            /safaris/{safari.slug}
          </Link>
          .
        </p>
      )}

      <SafariForm safari={safari} />
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
      <input type="hidden" name="kind" value="safaris" />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton variant={variant} confirm={confirm}>
        {label}
      </SubmitButton>
    </form>
  );
}

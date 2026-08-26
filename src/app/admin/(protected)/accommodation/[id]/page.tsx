import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, StatusPill, Tag } from "@/components/admin/ui";
import { ApartmentForm } from "@/components/admin/apartment-form";
import { SubmitButton } from "@/components/admin/form";
import { setContentStatus } from "@/app/actions/admin/content";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/env";
import type { Amenity, ApartmentWithPhotos } from "@/lib/types";

export const metadata = { title: "Edit Accommodation" };

export default async function EditAccommodationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const db = supabaseAdmin();

  const [{ data: apartmentRow }, { data: amenityRows }, { count: bookingCount }] =
    await Promise.all([
      db.from("apartments").select("*, apartment_photos(*)").eq("id", id).maybeSingle(),
      db
        .from("amenities")
        .select("*")
        .neq("status", "archived")
        .order("display_order")
        .order("name"),
      db
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("apartment_id", id),
    ]);

  const apartment = apartmentRow as ApartmentWithPhotos | null;
  if (!apartment) notFound();

  const hasHistory = (bookingCount ?? 0) > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={apartment.name}
        subtitle={`/accommodation/${apartment.slug}`}
        back={{ href: "/admin/accommodation", label: "Accommodation" }}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill status={apartment.status} />
            {apartment.status === "published" ? (
              <StatusForm id={apartment.id} status="hidden" label="Unpublish" />
            ) : (
              apartment.status !== "archived" && (
                <StatusForm id={apartment.id} status="published" label="Publish" />
              )
            )}
            {apartment.status !== "archived" && (
              <StatusForm
                id={apartment.id}
                status="archived"
                label="Archive"
                variant="danger"
                confirm={
                  hasHistory
                    ? "Archiving keeps this accommodation out of the website but preserves its booking history. Continue?"
                    : "Archive this accommodation? It will no longer appear on the website."
                }
              />
            )}
          </div>
        }
      />

      {created && (
        <p className="rounded-xl bg-[#dff0e4] px-4 py-3.5 text-sm text-[#1f6b3a]">
          Created. The page is live at{" "}
          <Link href={`/accommodation/${apartment.slug}`} className="underline">
            /accommodation/{apartment.slug}
          </Link>{" "}
          as soon as you set the status to Published.
        </p>
      )}

      {hasHistory && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-sand-deep/70 px-4 py-3 text-xs text-ink-muted">
          <Tag tone="ocean">
            {bookingCount} {bookingCount === 1 ? "booking" : "bookings"} on record
          </Tag>
          <span>
            This accommodation cannot be deleted — archive it instead so historical
            bookings keep their details.
          </span>
        </div>
      )}

      <ApartmentForm
        apartment={apartment}
        amenities={(amenityRows as Amenity[]) ?? []}
        siteUrl={siteUrl()}
      />
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
      <input type="hidden" name="kind" value="accommodation" />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton variant={variant} confirm={confirm}>
        {label}
      </SubmitButton>
    </form>
  );
}

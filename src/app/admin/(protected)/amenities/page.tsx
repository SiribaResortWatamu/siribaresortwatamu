import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusPill,
  Tag,
  Td,
  TableWrap,
  Th,
} from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/form";
import { AmenityForm } from "@/components/admin/amenity-form";
import { AmenityIcon } from "@/components/site/amenity-icon";
import { deleteAmenity } from "@/app/actions/admin/content";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Amenity } from "@/lib/types";

export const metadata = { title: "Amenities" };

export default async function AmenitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;

  const { data } = await supabaseAdmin()
    .from("amenities")
    .select("*")
    .order("display_order")
    .order("name");

  const amenities = (data as Amenity[]) ?? [];
  const editing = edit && edit !== "new" ? amenities.find((a) => a.id === edit) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Amenities"
        subtitle="The shared list you tick against each accommodation."
        actions={
          <Link href="/admin/amenities?edit=new" className="btn btn-primary btn-sm">
            <Plus size={15} strokeWidth={2} />
            Add amenity
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <Panel bodyClassName="">
          {amenities.length === 0 ? (
            <EmptyState
              icon={<Sparkles size={20} strokeWidth={1.4} />}
              title="No amenities yet"
              description="Add the things every stay includes — pool, Wi-Fi, air conditioning — then tick them on each apartment."
              action={
                <Link href="/admin/amenities?edit=new" className="btn btn-primary btn-sm">
                  <Plus size={15} strokeWidth={2} />
                  Add amenity
                </Link>
              }
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Amenity</Th>
                  <Th>Order</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {amenities.map((amenity) => (
                  <tr key={amenity.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ocean-soft text-ocean">
                          <AmenityIcon name={amenity.icon} size={17} />
                        </span>
                        <div className="min-w-0">
                          <span className="block font-medium">{amenity.name}</span>
                          {amenity.description && (
                            <span className="block truncate text-xs text-ink-muted">
                              {amenity.description}
                            </span>
                          )}
                        </div>
                        {amenity.is_featured && <Tag tone="terracotta">Featured</Tag>}
                      </div>
                    </Td>
                    <Td className="text-sm tabular-nums">{amenity.display_order}</Td>
                    <Td>
                      <StatusPill status={amenity.status} />
                    </Td>
                    <Td align="right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/amenities?edit=${amenity.id}`}
                          className="btn btn-outline btn-sm"
                        >
                          Edit
                        </Link>
                        <form action={deleteAmenity}>
                          <input type="hidden" name="id" value={amenity.id} />
                          <SubmitButton
                            variant="danger"
                            confirm={`Delete "${amenity.name}"? It will be removed from every accommodation that uses it.`}
                          >
                            Delete
                          </SubmitButton>
                        </form>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>

        <div className="lg:sticky lg:top-6">
          {edit ? (
            <AmenityForm key={edit} amenity={editing} />
          ) : (
            <div className="panel p-6 text-sm leading-relaxed text-ink-muted">
              Amenities appear on the Amenities page and in the grid on each
              accommodation page. Mark the important ones as{" "}
              <strong className="text-ink">featured</strong> to show them on the homepage.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

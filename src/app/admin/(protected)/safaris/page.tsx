import Link from "next/link";
import Image from "next/image";
import { Compass, ExternalLink, Plus } from "lucide-react";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusPill,
  Td,
  TableWrap,
  Th,
} from "@/components/admin/ui";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { coverImage } from "@/lib/images";
import { formatMoney, humanise } from "@/lib/format";
import type { SafariWithDetail } from "@/lib/types";

export const metadata = { title: "Safaris" };

export default async function AdminSafarisPage() {
  const { data } = await supabaseAdmin()
    .from("safari_packages")
    .select("*, safari_photos(*), safari_itinerary_days(id)")
    .order("display_order")
    .order("name");

  const safaris = (data as SafariWithDetail[]) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Safaris"
        subtitle="Each safari gets its own page, built from the shared template."
        actions={
          <>
            <Link href="/admin/safaris/enquiries" className="btn btn-outline btn-sm">
              Enquiries
            </Link>
            <Link href="/admin/safaris/new" className="btn btn-primary btn-sm">
              <Plus size={15} strokeWidth={2} />
              Add New Safari
            </Link>
          </>
        }
      />

      <Panel bodyClassName="">
        {safaris.length === 0 ? (
          <EmptyState
            icon={<Compass size={20} strokeWidth={1.4} />}
            title="No safaris yet"
            description="Build your first itinerary. You can add as many days as the trip needs."
            action={
              <Link href="/admin/safaris/new" className="btn btn-primary btn-sm">
                <Plus size={15} strokeWidth={2} />
                Add safari
              </Link>
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Safari</Th>
                <Th>Destination</Th>
                <Th>Duration</Th>
                <Th align="right">Price</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {safaris.map((safari) => {
                const cover = coverImage(safari.safari_photos);
                const dayCount = safari.safari_itinerary_days?.length ?? 0;

                return (
                  <tr key={safari.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-md bg-sand-deep">
                          {cover && (
                            <Image
                              src={cover}
                              alt=""
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/safaris/${safari.id}`}
                            className="font-medium transition-colors hover:text-terracotta"
                          >
                            {safari.name}
                          </Link>
                          <p className="truncate text-xs text-ink-muted">
                            {dayCount > 0
                              ? `${dayCount} itinerary ${dayCount === 1 ? "day" : "days"}`
                              : "No itinerary yet"}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-sm">{safari.destination ?? "—"}</Td>
                    <Td className="text-sm whitespace-nowrap">{safari.duration ?? "—"}</Td>
                    <Td align="right" className="text-sm whitespace-nowrap">
                      {safari.price_display_mode === "on_enquiry" ? (
                        <span className="text-ink-muted">On enquiry</span>
                      ) : (
                        <>
                          {formatMoney(safari.price, safari.currency, { decimals: false })}
                          <span className="block text-xs text-ink-muted">
                            {humanise(safari.price_display_mode).toLowerCase()}
                          </span>
                        </>
                      )}
                    </Td>
                    <Td>
                      <StatusPill status={safari.status} />
                    </Td>
                    <Td align="right">
                      <div className="flex justify-end gap-2">
                        {safari.status === "published" && (
                          <Link
                            href={`/safaris/${safari.slug}`}
                            target="_blank"
                            aria-label={`View ${safari.name} on the website`}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-sand-deep hover:text-ink"
                          >
                            <ExternalLink size={14} strokeWidth={1.6} />
                          </Link>
                        )}
                        <Link
                          href={`/admin/safaris/${safari.id}`}
                          className="btn btn-outline btn-sm"
                        >
                          Edit
                        </Link>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
}

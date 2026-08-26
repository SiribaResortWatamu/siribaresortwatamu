import Link from "next/link";
import Image from "next/image";
import { Car, ExternalLink, Plus } from "lucide-react";
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
import { formatMoney } from "@/lib/format";
import { transferPriceLabel } from "@/lib/pricing";
import type { TransferWithPhotos } from "@/lib/types";

export const metadata = { title: "Transfers" };

export default async function AdminTransfersPage() {
  const { data } = await supabaseAdmin()
    .from("transfer_services")
    .select("*, transfer_photos(*)")
    .order("display_order")
    .order("name");

  const transfers = (data as TransferWithPhotos[]) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transfer services"
        subtitle="Taxi and transfer products, each with its own generated page."
        actions={
          <>
            <Link href="/admin/transfers/requests" className="btn btn-outline btn-sm">
              Requests
            </Link>
            <Link href="/admin/transfers/new" className="btn btn-primary btn-sm">
              <Plus size={15} strokeWidth={2} />
              Add New Transfer
            </Link>
          </>
        }
      />

      <Panel bodyClassName="">
        {transfers.length === 0 ? (
          <EmptyState
            icon={<Car size={20} strokeWidth={1.4} />}
            title="No transfer services yet"
            description="Create an airport transfer, a local taxi service or a full-day driver."
            action={
              <Link href="/admin/transfers/new" className="btn btn-primary btn-sm">
                <Plus size={15} strokeWidth={2} />
                Add transfer service
              </Link>
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Service</Th>
                <Th>Type</Th>
                <Th>Capacity</Th>
                <Th align="right">Price</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {transfers.map((transfer) => {
                const cover = coverImage(transfer.transfer_photos);

                return (
                  <tr key={transfer.id}>
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
                            href={`/admin/transfers/${transfer.id}`}
                            className="font-medium transition-colors hover:text-terracotta"
                          >
                            {transfer.name}
                          </Link>
                          <p className="truncate text-xs text-ink-muted">
                            /transfers/{transfer.slug}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-sm">{transfer.service_type}</Td>
                    <Td className="text-sm whitespace-nowrap">
                      {transfer.passenger_capacity} pax
                      <span className="block text-xs text-ink-muted">
                        {transfer.luggage_capacity} bags
                      </span>
                    </Td>
                    <Td align="right" className="text-sm whitespace-nowrap">
                      {transfer.pricing_method === "on_enquiry" ? (
                        <span className="text-ink-muted">On enquiry</span>
                      ) : (
                        <>
                          {formatMoney(transfer.price, transfer.currency, {
                            decimals: false,
                          })}
                          <span className="block text-xs text-ink-muted">
                            {transferPriceLabel(transfer.pricing_method)}
                          </span>
                        </>
                      )}
                    </Td>
                    <Td>
                      <StatusPill status={transfer.status} />
                    </Td>
                    <Td align="right">
                      <div className="flex justify-end gap-2">
                        {transfer.status === "published" && (
                          <Link
                            href={`/transfers/${transfer.slug}`}
                            target="_blank"
                            aria-label={`View ${transfer.name} on the website`}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-sand-deep hover:text-ink"
                          >
                            <ExternalLink size={14} strokeWidth={1.6} />
                          </Link>
                        )}
                        <Link
                          href={`/admin/transfers/${transfer.id}`}
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

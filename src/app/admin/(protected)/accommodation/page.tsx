import Link from "next/link";
import Image from "next/image";
import { BedDouble, ExternalLink, Plus, RefreshCw } from "lucide-react";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusPill,
  Td,
  TableWrap,
  Th,
} from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/form";
import { syncCalendarsNow } from "@/app/actions/admin/bookings";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { coverImage } from "@/lib/images";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { ApartmentWithPhotos } from "@/lib/types";

export const metadata = { title: "Accommodation" };

export default async function AdminAccommodationPage() {
  const { data } = await supabaseAdmin()
    .from("apartments")
    .select("*, apartment_photos(*)")
    .order("display_order")
    .order("name");

  const apartments = (data as ApartmentWithPhotos[]) ?? [];
  const withChannels = apartments.filter(
    (a) => a.airbnb_ical_url || a.booking_com_ical_url,
  );
  const lastSync = withChannels
    .map((a) => a.last_synced_at)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accommodation"
        subtitle="Add a room and its public page is created from the template automatically."
        actions={
          <>
            {withChannels.length > 0 && (
              <form action={syncCalendarsNow}>
                <SubmitButton variant="outline">
                  <RefreshCw size={14} strokeWidth={1.75} />
                  Sync calendars
                </SubmitButton>
              </form>
            )}
            <Link href="/admin/accommodation/new" className="btn btn-primary btn-sm">
              <Plus size={15} strokeWidth={2} />
              Add New
            </Link>
          </>
        }
      />

      {lastSync && (
        <p className="text-xs text-ink-muted">
          Channel calendars last synchronised {formatDateTime(lastSync)}. They also sync
          automatically every two hours.
        </p>
      )}

      <Panel bodyClassName="">
        {apartments.length === 0 ? (
          <EmptyState
            icon={<BedDouble size={20} strokeWidth={1.4} />}
            title="No accommodation yet"
            description="Create your first room or apartment. Its page on the website is generated from the shared template — no developer needed."
            action={
              <Link href="/admin/accommodation/new" className="btn btn-primary btn-sm">
                <Plus size={15} strokeWidth={2} />
                Add accommodation
              </Link>
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Accommodation</Th>
                <Th>Sleeps</Th>
                <Th align="right">Rate</Th>
                <Th>Housekeeping</Th>
                <Th>Channels</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {apartments.map((apartment) => {
                const cover = coverImage(apartment.apartment_photos);
                const channels = [
                  apartment.airbnb_ical_url && "Airbnb",
                  apartment.booking_com_ical_url && "Booking.com",
                ].filter(Boolean) as string[];

                return (
                  <tr key={apartment.id}>
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
                            href={`/admin/accommodation/${apartment.id}`}
                            className="font-medium transition-colors hover:text-terracotta"
                          >
                            {apartment.name}
                          </Link>
                          <p className="truncate text-xs text-ink-muted">
                            /accommodation/{apartment.slug}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-sm whitespace-nowrap">
                      {apartment.max_guests} guests
                      <span className="block text-xs text-ink-muted">
                        {apartment.bedrooms} bed · {apartment.bathrooms} bath
                      </span>
                    </Td>
                    <Td align="right" className="text-sm whitespace-nowrap">
                      {formatMoney(apartment.nightly_rate, apartment.currency, {
                        decimals: false,
                      })}
                      <span className="block text-xs text-ink-muted">per night</span>
                    </Td>
                    <Td>
                      <StatusPill status={apartment.housekeeping} />
                    </Td>
                    <Td className="text-xs text-ink-muted">
                      {channels.length ? channels.join(", ") : "—"}
                    </Td>
                    <Td>
                      <StatusPill status={apartment.status} />
                    </Td>
                    <Td align="right">
                      <div className="flex justify-end gap-2">
                        {apartment.status === "published" && (
                          <Link
                            href={`/accommodation/${apartment.slug}`}
                            target="_blank"
                            aria-label={`View ${apartment.name} on the website`}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-sand-deep hover:text-ink"
                          >
                            <ExternalLink size={14} strokeWidth={1.6} />
                          </Link>
                        )}
                        <Link
                          href={`/admin/accommodation/${apartment.id}`}
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

import { CalendarOff } from "lucide-react";
import { EmptyState, Panel, Tag, Td, TableWrap, Th } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/form";
import { BlockForm } from "@/components/admin/block-form";
import { deleteBlock } from "@/app/actions/admin/bookings";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDate, humanise, toDateKey } from "@/lib/format";
import type { BlockedDate } from "@/lib/types";

const CHANNEL_NAMES: Record<string, string> = {
  airbnb: "Airbnb reservation",
  booking_com: "Booking.com reservation",
};

/**
 * One accommodation's own blocked dates: what is already off sale, and a
 * form to take more nights off sale for this accommodation alone.
 *
 * Reservations that arrive from Airbnb and Booking.com are listed too, so
 * the picture is complete, but they belong to the channel and are managed by
 * the calendar sync — they cannot be removed here.
 */
export async function ApartmentBlocks({
  apartmentId,
  apartmentName,
}: {
  apartmentId: string;
  apartmentName: string;
}) {
  const today = toDateKey(new Date());

  const { data } = await supabaseAdmin()
    .from("blocked_dates")
    .select("*")
    .eq("apartment_id", apartmentId)
    .gte("end_date", today)
    .order("start_date");

  const blocks = (data as BlockedDate[]) ?? [];

  return (
    <section id="blocked-dates" className="scroll-mt-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <Panel
          title="Blocked dates"
          description={`Nights ${apartmentName} cannot be booked. Past blocks are not shown.`}
          bodyClassName=""
        >
          {blocks.length === 0 ? (
            <EmptyState
              icon={<CalendarOff size={20} strokeWidth={1.4} />}
              title="Nothing blocked"
              description="Use the form to take dates off sale for maintenance, an owner stay or a private event."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>From</Th>
                  <Th>Until</Th>
                  <Th>Reason</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {blocks.map((block) => {
                  const managedByAdmin = block.source === "admin";
                  return (
                    <tr key={block.id}>
                      <Td className="text-sm whitespace-nowrap">{formatDate(block.start_date)}</Td>
                      <Td className="text-sm whitespace-nowrap">{formatDate(block.end_date)}</Td>
                      <Td>
                        <span className="text-sm">
                          {managedByAdmin
                            ? humanise(block.reason)
                            : (CHANNEL_NAMES[block.source] ?? humanise(block.source))}
                        </span>
                        {block.note && (
                          <span className="block text-xs text-ink-muted">{block.note}</span>
                        )}
                      </Td>
                      <Td align="right">
                        {managedByAdmin ? (
                          <form action={deleteBlock}>
                            <input type="hidden" name="id" value={block.id} />
                            <SubmitButton
                              variant="danger"
                              confirm="Remove this block and put the dates back on sale?"
                            >
                              Remove
                            </SubmitButton>
                          </form>
                        ) : (
                          <Tag tone="ocean">Synced</Tag>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
        </Panel>

        <BlockForm apartment={{ id: apartmentId, name: apartmentName }} />
      </div>
    </section>
  );
}

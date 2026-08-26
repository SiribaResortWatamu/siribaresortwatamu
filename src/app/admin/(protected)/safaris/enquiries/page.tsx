import Link from "next/link";
import { Compass } from "lucide-react";
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
import { formatDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EnquiryStatus, SafariEnquiry } from "@/lib/types";

export const metadata = { title: "Safari Enquiries" };

const FILTERS: { value: string; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

const OPEN_STATUSES: EnquiryStatus[] = ["new", "contacted", "quoted"];

export default async function SafariEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "open" } = await searchParams;

  let query = supabaseAdmin()
    .from("safari_enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (status === "open") {
    query = query.in("status", OPEN_STATUSES);
  } else if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data } = await query;
  const enquiries = (data as SafariEnquiry[]) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Safari enquiries"
        subtitle="Everyone who has asked about a safari, and where each one stands."
        back={{ href: "/admin/safaris", label: "Safaris" }}
      />

      <nav className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/safaris/enquiries?status=${filter.value}`}
            className={cn(
              "pill border transition-colors",
              status === filter.value
                ? "border-ocean bg-ocean text-white"
                : "border-line bg-white text-ink-muted hover:border-ink hover:text-ink",
            )}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <Panel bodyClassName="">
        {enquiries.length === 0 ? (
          <EmptyState
            icon={<Compass size={20} strokeWidth={1.4} />}
            title="No enquiries here"
            description="Enquiries sent through a safari page land in this list."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Guest</Th>
                <Th>Safari</Th>
                <Th>Travel date</Th>
                <Th>Travellers</Th>
                <Th>Received</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enquiry) => (
                <tr key={enquiry.id}>
                  <Td>
                    <Link
                      href={`/admin/safaris/enquiries/${enquiry.id}`}
                      className="font-medium transition-colors hover:text-terracotta"
                    >
                      {enquiry.name}
                    </Link>
                    <span className="block truncate text-xs text-ink-muted">
                      {enquiry.email}
                    </span>
                  </Td>
                  <Td className="text-sm">{enquiry.safari_name_snapshot}</Td>
                  <Td className="text-sm whitespace-nowrap">
                    {enquiry.travel_date ? formatDate(enquiry.travel_date) : "Flexible"}
                    {enquiry.date_flexible && enquiry.travel_date && (
                      <span className="block text-xs text-ink-muted">flexible</span>
                    )}
                  </Td>
                  <Td className="text-sm whitespace-nowrap">
                    {enquiry.travellers}
                    <span className="block text-xs text-ink-muted">
                      {enquiry.adults}a · {enquiry.children}c
                    </span>
                  </Td>
                  <Td className="text-xs whitespace-nowrap text-ink-muted">
                    {timeAgo(enquiry.created_at)}
                  </Td>
                  <Td>
                    <StatusPill status={enquiry.status} />
                  </Td>
                  <Td align="right">
                    <Link
                      href={`/admin/safaris/enquiries/${enquiry.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      Open
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
}

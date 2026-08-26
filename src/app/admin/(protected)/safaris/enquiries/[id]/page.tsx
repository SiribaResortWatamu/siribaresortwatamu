import { notFound } from "next/navigation";
import { Mail, MessageCircle, Phone } from "lucide-react";
import {
  DescriptionList,
  PageHeader,
  Panel,
  StatusPill,
} from "@/components/admin/ui";
import { EnquiryEditor } from "@/components/admin/enquiry-editor";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { telLink, whatsappLink } from "@/lib/whatsapp";
import type { SafariEnquiry } from "@/lib/types";

export const metadata = { title: "Safari Enquiry" };

export default async function SafariEnquiryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data } = await supabaseAdmin()
    .from("safari_enquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const enquiry = data as SafariEnquiry | null;
  if (!enquiry) notFound();

  const wa = whatsappLink(
    enquiry.whatsapp ?? enquiry.phone,
    `Hello ${enquiry.name.split(" ")[0]}, thank you for your enquiry about the ${enquiry.safari_name_snapshot}.`,
  );
  const tel = telLink(enquiry.phone);

  return (
    <div className="space-y-6">
      <PageHeader
        title={enquiry.name}
        subtitle={`${enquiry.safari_name_snapshot} · ${enquiry.reference}`}
        back={{ href: "/admin/safaris/enquiries", label: "Safari enquiries" }}
        actions={<StatusPill status={enquiry.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Panel title="The enquiry">
            <DescriptionList
              items={[
                { label: "Reference", value: enquiry.reference },
                { label: "Safari", value: enquiry.safari_name_snapshot },
                {
                  label: "Preferred date",
                  value: enquiry.travel_date
                    ? `${formatDate(enquiry.travel_date)}${enquiry.date_flexible ? " (flexible)" : ""}`
                    : "Flexible",
                },
                {
                  label: "Travellers",
                  value: `${enquiry.adults} ${enquiry.adults === 1 ? "adult" : "adults"}, ${enquiry.children} ${enquiry.children === 1 ? "child" : "children"}`,
                },
                {
                  label: "Quoted",
                  value: enquiry.quoted_amount
                    ? formatMoney(enquiry.quoted_amount, enquiry.currency)
                    : "Not yet quoted",
                },
                { label: "Received", value: formatDateTime(enquiry.created_at) },
              ]}
            />
          </Panel>

          {enquiry.special_requests && (
            <Panel title="What they told us">
              <p className="text-sm leading-relaxed whitespace-pre-line text-ink-muted">
                {enquiry.special_requests}
              </p>
            </Panel>
          )}

          <Panel title="Get in touch">
            <DescriptionList
              items={[
                { label: "Email", value: enquiry.email },
                { label: "Phone", value: enquiry.phone ?? "—" },
                { label: "WhatsApp", value: enquiry.whatsapp ?? "—" },
              ]}
            />

            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={`mailto:${enquiry.email}?subject=${encodeURIComponent(`Your safari enquiry — ${enquiry.reference}`)}`}
                className="btn btn-outline btn-sm"
              >
                <Mail size={14} strokeWidth={1.6} />
                Email
              </a>
              {tel && (
                <a href={tel} className="btn btn-outline btn-sm">
                  <Phone size={14} strokeWidth={1.6} />
                  Call
                </a>
              )}
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp btn-sm"
                >
                  <MessageCircle size={14} strokeWidth={1.75} />
                  WhatsApp
                </a>
              )}
            </div>
          </Panel>
        </div>

        <EnquiryEditor enquiry={enquiry} />
      </div>
    </div>
  );
}

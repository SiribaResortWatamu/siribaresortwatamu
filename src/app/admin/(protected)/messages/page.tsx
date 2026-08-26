import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusPill,
} from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/form";
import { MessageNote } from "@/components/admin/message-note";
import { setMessageStatus } from "@/app/actions/admin/operations";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatDateTime, timeAgo } from "@/lib/format";
import { telLink, whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { ContactMessage } from "@/lib/types";

export const metadata = { title: "Messages" };

const FILTERS = [
  { value: "inbox", label: "Inbox" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "inbox" } = await searchParams;

  let query = supabaseAdmin()
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (status === "inbox") {
    query = query.in("status", ["unread", "read"]);
  } else if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data } = await query.limit(200);
  const messages = (data as ContactMessage[]) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        subtitle="Everything sent through the contact form."
      />

      <nav className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/messages?status=${filter.value}`}
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

      {messages.length === 0 ? (
        <Panel bodyClassName="">
          <EmptyState
            icon={<Mail size={20} strokeWidth={1.4} />}
            title="Nothing here"
            description="Messages from the contact page arrive in this inbox."
          />
        </Panel>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => {
            const wa = whatsappLink(
              message.phone,
              `Hello ${message.name.split(" ")[0]}, thank you for getting in touch with Siriba Resort Watamu.`,
            );
            const tel = telLink(message.phone);

            return (
              <article
                key={message.id}
                className={cn(
                  "panel p-5",
                  message.status === "unread" && "border-terracotta/40 bg-terracotta-soft/20",
                )}
              >
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-display text-base font-semibold">
                        {message.subject || "No subject"}
                      </h2>
                      <StatusPill status={message.status} />
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      {message.name} · {message.email}
                      {message.phone && ` · ${message.phone}`}
                    </p>
                  </div>
                  <p
                    className="shrink-0 text-xs text-ink-muted"
                    title={formatDateTime(message.created_at)}
                  >
                    {timeAgo(message.created_at)}
                  </p>
                </header>

                <p className="mt-4 text-sm leading-relaxed whitespace-pre-line">
                  {message.message}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                  <a
                    href={`mailto:${message.email}?subject=${encodeURIComponent(
                      message.subject ? `Re: ${message.subject}` : "Your message to Siriba Resort",
                    )}`}
                    className="btn btn-primary btn-sm"
                  >
                    <Mail size={14} strokeWidth={1.6} />
                    Reply by email
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

                  <span className="ml-auto flex gap-2">
                    {message.status !== "replied" && (
                      <StatusAction
                        id={message.id}
                        status="replied"
                        label="Mark replied"
                      />
                    )}
                    {message.status === "unread" && (
                      <StatusAction id={message.id} status="read" label="Mark read" />
                    )}
                    {message.status !== "archived" ? (
                      <StatusAction id={message.id} status="archived" label="Archive" />
                    ) : (
                      <StatusAction id={message.id} status="read" label="Restore" />
                    )}
                  </span>
                </div>

                <MessageNote message={message} />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusAction({
  id,
  status,
  label,
}: {
  id: string;
  status: string;
  label: string;
}) {
  return (
    <form action={setMessageStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton variant="outline">{label}</SubmitButton>
    </form>
  );
}

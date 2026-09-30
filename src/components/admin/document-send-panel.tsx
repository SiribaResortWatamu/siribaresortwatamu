"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { AdminField } from "@/components/admin/form";

/**
 * Send a document from your own email account.
 *
 * Nothing is sent from here: the buttons open a ready-written draft in
 * Gmail, or in whatever email app the computer uses, so it goes out from
 * your real address and replies come straight back to you. A link cannot
 * carry an attachment, so the message contains the client's link, where
 * they can view the document and download the PDF.
 */
export function DocumentSendPanel({
  email,
  subject: initialSubject,
  message: initialMessage,
}: {
  email: string;
  subject: string;
  message: string;
}) {
  const [to, setTo] = useState(email);
  const [subject, setSubject] = useState(initialSubject);
  const [message, setMessage] = useState(initialMessage);

  const query = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  const mailto = `mailto:${encodeURIComponent(to.trim())}?${query}`;
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to.trim())}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  const ready = to.includes("@");

  return (
    <div className="space-y-3">
      <AdminField label="To">
        <input
          type="email"
          className="input"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="client@example.com"
        />
      </AdminField>
      <AdminField label="Subject">
        <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </AdminField>
      <AdminField label="Message" hint="edit it however you like">
        <textarea
          className="textarea"
          rows={9}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </AdminField>

      <div className="flex flex-wrap gap-2">
        <a
          href={gmail}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!ready}
          className={`btn btn-outline btn-sm ${ready ? "" : "pointer-events-none opacity-50"}`}
        >
          <Mail size={14} strokeWidth={1.6} />
          Open in Gmail
        </a>
        <a
          href={mailto}
          aria-disabled={!ready}
          className={`btn btn-outline btn-sm ${ready ? "" : "pointer-events-none opacity-50"}`}
        >
          Open in email app
        </a>
      </div>
      <p className="text-xs text-ink-muted">
        Opens a draft for you to review and send. The client gets a link to view and download
        the PDF.
      </p>
    </div>
  );
}

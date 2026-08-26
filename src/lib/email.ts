import "server-only";
import { Resend } from "resend";
import { emailFrom, resendApiKey, siteUrl } from "@/lib/env";

/**
 * Email delivery.
 *
 * Resend is optional at launch: without an API key the message is logged to
 * the server console instead, so a fresh install still works end to end and
 * nothing silently disappears.
 */

let client: Resend | null = null;

function resend(): Resend | null {
  const key = resendApiKey();
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export interface MailInput {
  to: string | string[];
  subject: string;
  heading: string;
  intro?: string;
  rows?: { label: string; value: string }[];
  body?: string[];
  cta?: { label: string; href: string };
  footnote?: string;
  replyTo?: string;
}

export async function sendMail(input: MailInput): Promise<{ sent: boolean; error?: string }> {
  const html = renderEmail(input);
  const recipients = Array.isArray(input.to) ? input.to : [input.to];
  const valid = recipients.filter((r) => r && r.includes("@"));
  if (valid.length === 0) return { sent: false, error: "No recipient" };

  const api = resend();
  if (!api) {
    console.info(
      `[email] RESEND_API_KEY not set — would have sent "${input.subject}" to ${valid.join(", ")}`,
    );
    return { sent: false, error: "Email is not configured" };
  }

  try {
    const { error } = await api.emails.send({
      from: emailFrom(),
      to: valid,
      subject: input.subject,
      html,
      replyTo: input.replyTo,
    });
    if (error) {
      console.error("[email] send failed", error);
      return { sent: false, error: error.message };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] send threw", err);
    return { sent: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Emails are built from one template so every message from the property
 * looks the same. Inline styles only — mail clients discard stylesheets.
 */
function renderEmail({ heading, intro, rows, body, cta, footnote }: MailInput): string {
  const rowsHtml = (rows ?? [])
    .map(
      ({ label, value }) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e0d6c6;color:#6b6459;font-size:14px;">${escapeHtml(label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e0d6c6;color:#26241f;font-size:14px;font-weight:500;text-align:right;">${escapeHtml(value)}</td>
      </tr>`,
    )
    .join("");

  const bodyHtml = (body ?? [])
    .map(
      (p) =>
        `<p style="margin:0 0 16px;color:#6b6459;font-size:15px;line-height:1.7;">${escapeHtml(p)}</p>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f1e9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e9;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e0d6c6;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#2c6e6b;padding:26px 32px;">
              <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.01em;">Siriba Resort Watamu</p>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.65);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">Watamu &middot; Kenya</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;color:#26241f;font-size:22px;font-weight:600;line-height:1.3;">${escapeHtml(heading)}</h1>
              ${intro ? `<p style="margin:0 0 22px;color:#6b6459;font-size:15px;line-height:1.7;">${escapeHtml(intro)}</p>` : ""}
              ${bodyHtml}
              ${rowsHtml ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">${rowsHtml}</table>` : ""}
              ${
                cta
                  ? `<a href="${cta.href}" style="display:inline-block;background:#c1694f;color:#ffffff;text-decoration:none;padding:13px 26px;border-radius:999px;font-size:15px;font-weight:500;">${escapeHtml(cta.label)}</a>`
                  : ""
              }
              ${footnote ? `<p style="margin:26px 0 0;color:#9a9186;font-size:13px;line-height:1.6;">${escapeHtml(footnote)}</p>` : ""}
            </td>
          </tr>
          <tr>
            <td style="background:#f6f1e9;padding:20px 32px;border-top:1px solid #e0d6c6;">
              <p style="margin:0;color:#9a9186;font-size:12px;line-height:1.6;">
                Siriba Resort Watamu &middot; Watamu, Kilifi County, Kenya<br>
                <a href="${siteUrl()}" style="color:#2c6e6b;text-decoration:none;">${siteUrl().replace(/^https?:\/\//, "")}</a>
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

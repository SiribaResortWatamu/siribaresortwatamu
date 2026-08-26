/**
 * Environment access with clear failure messages.
 *
 * The public values are inlined at build time by Next, so they are read as
 * literal `process.env.X` expressions rather than through a dynamic lookup.
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill it in — see README.md.`,
    );
  }
  return value;
}

export const supabaseUrl = () =>
  required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");

export const supabaseAnonKey = () =>
  required(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY");

export const supabaseServiceKey = () =>
  required(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");

export const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const cronSecret = () => process.env.CRON_SECRET ?? "";

export const resendApiKey = () => process.env.RESEND_API_KEY ?? "";

export const emailFrom = () =>
  process.env.EMAIL_FROM ?? "Siriba Resort Watamu <onboarding@resend.dev>";

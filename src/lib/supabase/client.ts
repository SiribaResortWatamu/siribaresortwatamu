"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client. Used only for the admin sign-in form and sign-out —
 * all data mutations go through server actions.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

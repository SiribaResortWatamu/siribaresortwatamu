import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseServiceKey, supabaseUrl } from "@/lib/env";

let cached: SupabaseClient | null = null;

/**
 * Service-role client. Bypasses row level security.
 *
 * Every mutation in the app runs through this client from a server action or
 * route handler, which is what lets the server own pricing, availability and
 * booking validation. It must never be imported into a client component —
 * the `server-only` import above turns that into a build error.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!cached) {
    cached = createClient(supabaseUrl(), supabaseServiceKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

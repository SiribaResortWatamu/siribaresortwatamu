import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

let cached: SupabaseClient | null = null;

/**
 * Anon client with no cookie access.
 *
 * Row level security still applies, so this only ever sees published content.
 * Because it never touches request cookies, routes that use it — the sitemap,
 * for instance — can be cached rather than forced to render per request.
 */
export function supabasePublic(): SupabaseClient {
  if (!cached) {
    cached = createClient(supabaseUrl(), supabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

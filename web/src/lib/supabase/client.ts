import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

// Browser-side client (anon key). Respects RLS as whatever role is signed in
// (or `anon` if no one is signed in) — used from Client Components.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

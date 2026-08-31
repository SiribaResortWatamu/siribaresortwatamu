"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, ShieldAlert } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Shown when someone signs in successfully but is not on the staff list.
 *
 * Rendering this instead of redirecting is deliberate — see the note on
 * `AdminAccess` in lib/auth.ts.
 */
export function NotAuthorised({ email }: { email: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await createSupabaseBrowserClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl font-semibold">Siriba Resort Watamu</p>
          <p className="mt-1 text-[0.65rem] tracking-[0.22em] text-ink-muted uppercase">
            Staff Dashboard
          </p>
        </div>

        <div className="card space-y-4 p-7">
          <div className="flex items-start gap-2.5 rounded-lg bg-[#fbe1dc] px-3.5 py-3 text-sm text-[#a3402c]">
            <ShieldAlert size={16} strokeWidth={1.6} className="mt-0.5 shrink-0" />
            <span>This account does not have dashboard access.</span>
          </div>

          <div>
            <h1 className="font-display text-lg font-semibold">Not on the staff list</h1>
            <p className="mt-1 text-sm text-ink-muted">
              You are signed in{email ? ` as ${email}` : ""}, but that account has not
              been granted access. Ask the owner to add it, or sign in with a staff
              account.
            </p>
          </div>

          <button
            type="button"
            onClick={signOut}
            disabled={pending}
            className="btn btn-primary w-full"
          >
            {pending ? (
              <>
                <Loader2 size={16} className="animate-spin" strokeWidth={2} />
                Signing out…
              </>
            ) : (
              <>
                <LogOut size={16} strokeWidth={1.75} />
                Sign Out
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

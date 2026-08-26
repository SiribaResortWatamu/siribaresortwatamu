"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, LogIn, TriangleAlert } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AdminField } from "@/components/admin/form";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");

  // Only same-site admin paths are honoured, so `?next=` cannot bounce a
  // signed-in staff member to another host.
  const requested = searchParams.get("next") ?? "/admin";
  const next = requested.startsWith("/admin") ? requested : "/admin";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const supabase = createSupabaseBrowserClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    });

    if (signInError) {
      setPending(false);
      setError(
        signInError.message === "Invalid login credentials"
          ? "That email and password do not match an account."
          : signInError.message,
      );
      return;
    }

    router.replace(next);
    router.refresh();
  }

  async function sendReset() {
    setError(null);
    setNotice(null);

    if (!email.trim()) {
      setError("Enter your email address first, then choose Forgot password.");
      return;
    }

    setPending(true);
    const supabase = createSupabaseBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/auth/callback?type=recovery` },
    );
    setPending(false);

    // Deliberately the same message either way, so this cannot be used to
    // discover which email addresses have accounts.
    if (resetError) console.error("[login] reset failed", resetError);
    setNotice(
      "If that address has an account, a reset link is on its way. Check your inbox.",
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-7">
      <div>
        <h1 className="font-display text-lg font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Manage bookings, content and enquiries.
        </p>
      </div>

      <AdminField label="Email">
        <input
          name="email"
          type="email"
          className="input"
          required
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </AdminField>

      <AdminField label="Password">
        <input
          name="password"
          type="password"
          className="input"
          required
          autoComplete="current-password"
        />
      </AdminField>

      {error && (
        <p className="flex items-start gap-2.5 rounded-lg bg-[#fbe1dc] px-3.5 py-3 text-sm text-[#a3402c]">
          <TriangleAlert size={16} strokeWidth={1.6} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {notice && (
        <p className="flex items-start gap-2.5 rounded-lg bg-[#dff0e4] px-3.5 py-3 text-sm text-[#1f6b3a]">
          <CheckCircle2 size={16} strokeWidth={1.6} className="mt-0.5 shrink-0" />
          {notice}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" strokeWidth={2} />
            Signing in…
          </>
        ) : (
          <>
            <LogIn size={16} strokeWidth={1.75} />
            Sign In
          </>
        )}
      </button>

      <button
        type="button"
        onClick={sendReset}
        disabled={pending}
        className="w-full text-center text-xs font-medium text-ocean transition-colors hover:text-ocean-dark disabled:opacity-50"
      >
        Forgot your password?
      </button>
    </form>
  );
}

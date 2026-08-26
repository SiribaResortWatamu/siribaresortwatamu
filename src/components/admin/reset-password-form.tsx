"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound, Loader2, TriangleAlert } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AdminField } from "@/components/admin/form";

const MIN_LENGTH = 10;

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");

    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setPending(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setPending(false);
      setError(
        /session|expired|missing/i.test(updateError.message)
          ? "That link has expired. Please request a new one from the sign-in page."
          : updateError.message,
      );
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.replace("/admin");
      router.refresh();
    }, 1200);
  }

  if (done) {
    return (
      <div className="card p-7 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ocean-soft text-ocean">
          <CheckCircle2 size={24} strokeWidth={1.4} />
        </span>
        <h1 className="mt-4 font-display text-lg font-semibold">Password saved</h1>
        <p className="mt-2 text-sm text-ink-muted">Taking you to the dashboard…</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-7">
      <div>
        <h1 className="font-display text-lg font-semibold">Choose a password</h1>
        <p className="mt-1 text-sm text-ink-muted">
          You will use this with your email address to sign in from now on.
        </p>
      </div>

      <AdminField label="New password" hint={`at least ${MIN_LENGTH} characters`}>
        <input
          name="password"
          type="password"
          className="input"
          required
          minLength={MIN_LENGTH}
          autoComplete="new-password"
          autoFocus
        />
      </AdminField>

      <AdminField label="Confirm password">
        <input
          name="confirm"
          type="password"
          className="input"
          required
          minLength={MIN_LENGTH}
          autoComplete="new-password"
        />
      </AdminField>

      {error && (
        <p className="flex items-start gap-2.5 rounded-lg bg-[#fbe1dc] px-3.5 py-3 text-sm text-[#a3402c]">
          <TriangleAlert size={16} strokeWidth={1.6} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" strokeWidth={2} />
            Saving…
          </>
        ) : (
          <>
            <KeyRound size={16} strokeWidth={1.75} />
            Save Password
          </>
        )}
      </button>
    </form>
  );
}

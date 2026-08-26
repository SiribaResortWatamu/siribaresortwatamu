import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/admin/reset-password-form";

export const metadata: Metadata = {
  title: "Choose a Password",
  robots: { index: false, follow: false },
};

/**
 * Where a recovery link lands. The session already exists by the time this
 * renders — the callback route exchanged the code — so the person only has
 * to choose a new password.
 */
export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sand px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl font-semibold">Siriba Resort Watamu</p>
          <p className="mt-1 text-[0.65rem] tracking-[0.22em] text-ink-muted uppercase">
            Staff Dashboard
          </p>
        </div>

        <ResetPasswordForm />
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Staff Sign In",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sand px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl font-semibold">Siriba Resort Watamu</p>
          <p className="mt-1 text-[0.65rem] tracking-[0.22em] text-ink-muted uppercase">
            Staff Dashboard
          </p>
        </div>

        <Suspense fallback={<div className="card h-80" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-ink-muted">
          Accounts are created by the owner in Supabase. If you cannot get in, ask for
          a password reset.
        </p>
      </div>
    </main>
  );
}

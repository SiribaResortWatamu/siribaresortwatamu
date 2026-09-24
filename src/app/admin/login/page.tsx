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

        {/*
          No hint text here on purpose. Naming the backend, or explaining how
          staff accounts get created, tells anyone who finds this page more
          than they need. The reset link in the form covers the one thing a
          locked-out member of staff actually needs.
        */}
        <Suspense fallback={<div className="card h-80" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}

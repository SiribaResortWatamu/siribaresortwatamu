import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/**
 * The 404 for URLs that match no route at all — a mistyped address, a stale
 * link, an old page someone shared years ago.
 *
 * Deliberately self-contained. The header and footer live in the (site)
 * layout, which this never enters, and fetching settings just to draw them
 * would put a database call on the one page that most needs to survive
 * everything — including a bot walking a thousand made-up URLs. The links
 * below already cover everywhere a lost visitor wants to go.
 *
 * Bad slugs inside a real section, like /accommodation/nope, are caught
 * earlier by (site)/not-found.tsx and keep the full site chrome.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center bg-sand">
      <div className="shell-narrow py-24 text-center">
        <Link
          href="/"
          className="font-display text-xl font-semibold transition-colors hover:text-terracotta"
        >
          Siriba Resort Watamu
        </Link>

        <p className="font-display mt-12 text-6xl font-semibold text-terracotta/30">
          404
        </p>
        <h1 className="display-lg mt-5">We can&apos;t find that page</h1>
        <p className="rich-text mx-auto mt-5 max-w-md">
          It may have been moved, or the link might be out of date. Try one of these
          instead — or send us a message and we will point you the right way.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="btn btn-primary">
            Back to Home
          </Link>
          <Link href="/accommodation" className="btn btn-outline">
            View Accommodation
          </Link>
          <Link href="/contact" className="btn btn-outline">
            Contact Us
          </Link>
        </div>
      </div>
    </main>
  );
}

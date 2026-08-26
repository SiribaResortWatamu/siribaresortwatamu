import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[80vh] items-center bg-sand">
      <div className="shell-narrow py-32 text-center">
        <p className="font-display text-6xl font-semibold text-terracotta/30">404</p>
        <h1 className="display-lg mt-5">We can&apos;t find that page</h1>
        <p className="mx-auto mt-5 max-w-md rich-text">
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
    </section>
  );
}

import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Uses Node APIs and its own font/layout engine; bundling it breaks PDF output.
  serverExternalPackages: ["@react-pdf/renderer"],

  images: {
    remotePatterns: [
      // Uploaded media in the public Supabase Storage bucket.
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      // Demo photography that ships with the seed data.
      { protocol: "https" as const, hostname: "images.unsplash.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  /**
   * Baseline security headers.
   *
   * Vercel already sends HSTS; everything here is additional. The important
   * one is the frame blocking: without it the dashboard can be loaded into
   * an iframe on another site and an invisible overlay put over it, so a
   * signed-in owner clicking what looks like a harmless button is really
   * clicking Confirm or Delete in their own admin.
   *
   * `frame-ancestors` is the modern rule and `X-Frame-Options` the older
   * one; both are sent because some crawlers and older browsers only
   * understand the latter.
   *
   * Note what is deliberately absent: a full Content-Security-Policy with
   * `script-src`. Next.js injects inline bootstrap scripts, so a strict
   * policy needs per-request nonces and would silently break the site if
   * they were ever mismatched. That is worth doing properly, on its own,
   * rather than bolted on here.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          // Stop a file being executed as a type it does not declare.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Send the full URL within the site, only the origin off-site, so
          // booking references never leak in a Referer header.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nothing here needs any of these.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

import path from "node:path";
import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const nextConfig: NextConfig = {
  // Pin the workspace root to this app — the old static site's package-lock.json
  // one directory up would otherwise make Next.js guess the wrong root.
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: "https",
            hostname: supabaseUrl.hostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;

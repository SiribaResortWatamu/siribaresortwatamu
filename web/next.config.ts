import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app — the old static site's package-lock.json
  // one directory up would otherwise make Next.js guess the wrong root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;

import type { MetadataRoute } from "next";
import { supabasePublic } from "@/lib/supabase/public";
import { siteUrl } from "@/lib/env";

export const revalidate = 3600;

/**
 * Generated from the database, so a room, safari or transfer the owner
 * publishes appears in the sitemap without anyone touching the code.
 *
 * This reads through the cookie-free anon client so the route stays
 * cacheable — row level security still limits it to published records.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/accommodation`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/safaris`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/transfers`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/amenities`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacy-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const entries = await contentEntries(base);
  return [...staticRoutes, ...entries];
}

async function contentEntries(base: string): Promise<MetadataRoute.Sitemap> {
  try {
    const db = supabasePublic();

    const [apartments, safaris, transfers] = await Promise.all([
      db.from("apartments").select("slug, updated_at").eq("status", "published"),
      db.from("safari_packages").select("slug, updated_at").eq("status", "published"),
      db.from("transfer_services").select("slug, updated_at").eq("status", "published"),
    ]);

    type Row = { slug: string; updated_at: string };

    const map = (
      rows: Row[] | null,
      prefix: string,
      priority: number,
    ): MetadataRoute.Sitemap =>
      (rows ?? []).map((row) => ({
        url: `${base}${prefix}/${row.slug}`,
        lastModified: new Date(row.updated_at),
        changeFrequency: "weekly" as const,
        priority,
      }));

    return [
      ...map(apartments.data as Row[] | null, "/accommodation", 0.8),
      ...map(safaris.data as Row[] | null, "/safaris", 0.8),
      ...map(transfers.data as Row[] | null, "/transfers", 0.7),
    ];
  } catch (error) {
    // A sitemap listing only the fixed pages beats no sitemap at all.
    console.error("[sitemap] could not read published content", error);
    return [];
  }
}

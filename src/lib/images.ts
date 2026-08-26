import type { Photo } from "@/lib/types";

/**
 * Photo records hold either an absolute URL (demo content, or an image
 * hosted elsewhere) or a key inside the public `media` Supabase Storage
 * bucket. Both resolve to something `next/image` can load.
 */
export function resolveImage(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/media/${path.replace(/^media\//, "")}`;
}

/** Cover photo first, then display order. */
export function sortPhotos<T extends Photo>(photos: T[] | null | undefined): T[] {
  return [...(photos ?? [])].sort((a, b) => {
    if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
    return a.display_order - b.display_order;
  });
}

export function coverImage(photos: Photo[] | null | undefined): string | null {
  const sorted = sortPhotos(photos);
  return resolveImage(sorted[0]?.storage_path);
}

export function coverAlt(photos: Photo[] | null | undefined, fallback: string): string {
  const sorted = sortPhotos(photos);
  return sorted[0]?.alt_text ?? fallback;
}

/**
 * A calm sand-coloured placeholder for content that has no photo yet, so
 * an unfinished listing still looks deliberate rather than broken.
 */
export const IMAGE_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#efe6d8"/>
      <path d="M0 430c120-40 200 20 320-10s200-70 480-30v210H0z" fill="#e3d6c3"/>
      <circle cx="640" cy="130" r="52" fill="#f6f1e9"/>
    </svg>`.replace(/\s+/g, " "),
  );

/** Small blurred stand-in used while a real photo loads. */
export const BLUR_DATA_URL =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 6"><rect width="8" height="6" fill="#efe6d8"/></svg>`,
  );

// Pure helper, no server-only imports — safe to use from both Server and
// Client Components (unlike lib/apartments.ts, which pulls in next/headers).
const PHOTOS_BUCKET = "apartment-photos";

// Storage public URLs are deterministic, so no need for an async
// storage.from(bucket).getPublicUrl() round-trip per image.
export function publicPhotoUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PHOTOS_BUCKET}/${storagePath}`;
}

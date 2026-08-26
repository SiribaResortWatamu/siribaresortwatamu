"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaStar, FaTrash, FaArrowLeft, FaArrowRight, FaUpload } from "react-icons/fa6";
import {
  uploadApartmentPhotos,
  deleteApartmentPhoto,
  setCoverPhoto,
  moveApartmentPhoto,
} from "@/lib/actions/apartment-photos";
import { publicPhotoUrl } from "@/lib/photo-url";
import type { ApartmentPhoto } from "@/lib/supabase/types";

export default function ApartmentPhotoManager({
  apartmentId,
  photos,
}: {
  apartmentId: string;
  photos: ApartmentPhoto[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));

    const result = await uploadApartmentPhotos(apartmentId, formData);
    setUploading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  }

  async function withBusy(id: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusyId(id);
    setError("");
    const result = await fn();
    setBusyId(null);
    if (!result.ok) setError(result.error ?? "Something went wrong");
    router.refresh();
  }

  return (
    <div>
      <p className="mb-3 text-xs text-ink-muted">JPEG, PNG, WebP, or AVIF, up to 8MB each.</p>

      {photos.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((photo, i) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-xl border border-hairline">
              <div className="relative h-32 w-full">
                <Image
                  src={publicPhotoUrl(photo.storage_path)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="200px"
                />
              </div>
              {photo.is_cover && (
                <span className="absolute left-2 top-2 rounded-full bg-terracotta px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Cover
                </span>
              )}
              <div className="flex items-center justify-between gap-1 bg-white p-1.5">
                <button
                  type="button"
                  disabled={busyId === photo.id || i === 0}
                  onClick={() => withBusy(photo.id, () => moveApartmentPhoto(apartmentId, photo.id, "up"))}
                  aria-label="Move earlier"
                  className="rounded p-1.5 text-ink-muted hover:bg-sand disabled:opacity-30"
                >
                  <FaArrowLeft size={12} />
                </button>
                {!photo.is_cover && (
                  <button
                    type="button"
                    disabled={busyId === photo.id}
                    onClick={() => withBusy(photo.id, () => setCoverPhoto(apartmentId, photo.id))}
                    aria-label="Set as cover"
                    className="rounded p-1.5 text-ink-muted hover:bg-sand"
                  >
                    <FaStar size={12} />
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyId === photo.id}
                  onClick={() =>
                    withBusy(photo.id, () =>
                      deleteApartmentPhoto(apartmentId, photo.id, photo.storage_path)
                    )
                  }
                  aria-label="Delete photo"
                  className="rounded p-1.5 text-red-600 hover:bg-red-50"
                >
                  <FaTrash size={12} />
                </button>
                <button
                  type="button"
                  disabled={busyId === photo.id || i === photos.length - 1}
                  onClick={() => withBusy(photo.id, () => moveApartmentPhoto(apartmentId, photo.id, "down"))}
                  aria-label="Move later"
                  className="rounded p-1.5 text-ink-muted hover:bg-sand disabled:opacity-30"
                >
                  <FaArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-hairline p-6 text-sm text-ink-muted transition-colors hover:border-terracotta hover:text-terracotta">
        <FaUpload />
        {uploading ? "Uploading…" : "Click to upload photos"}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </label>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

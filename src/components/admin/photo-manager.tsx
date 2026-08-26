"use client";

/* eslint-disable @next/next/no-img-element -- admin thumbnails include
   freshly uploaded object URLs, which next/image cannot resolve. */

import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { resolveImage, sortPhotos } from "@/lib/images";
import type { Photo } from "@/lib/types";

interface DraftPhoto {
  key: string;
  storage_path: string;
  alt_text: string;
  is_cover: boolean;
  /** Local object URL while the file is still uploading. */
  preview?: string;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Gallery manager: upload, reorder, choose the cover, remove.
 *
 * Files go straight from the browser to Supabase Storage using the signed-in
 * staff session, so a large photo never passes through a server action. The
 * resulting ordered list is submitted as JSON alongside the rest of the form.
 */
export function PhotoManager({
  folder,
  photos,
}: {
  /** Storage prefix, e.g. `apartments/ocean-view`. */
  folder: string;
  photos: Photo[];
}) {
  const [items, setItems] = useState<DraftPhoto[]>(() =>
    sortPhotos(photos).map((photo) => ({
      key: photo.id,
      storage_path: photo.storage_path,
      alt_text: photo.alt_text ?? "",
      is_cover: photo.is_cover,
    })),
  );
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // The first photo is the cover unless one is explicitly starred.
  const payload = items.map((item, index) => ({
    storage_path: item.storage_path,
    alt_text: item.alt_text.trim() || null,
    display_order: index,
    is_cover: items.some((i) => i.is_cover) ? item.is_cover : index === 0,
  }));

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setError(null);

    const files = Array.from(fileList);
    const supabase = createSupabaseBrowserClient();

    for (const file of files) {
      if (!ACCEPTED.includes(file.type)) {
        setError(`${file.name} is not a JPEG, PNG, WebP or AVIF image.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is larger than 10 MB. Please resize it first.`);
        continue;
      }

      const key = `upload-${Math.random().toString(36).slice(2, 10)}`;
      const preview = URL.createObjectURL(file);
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${folder}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${extension}`;

      setUploading((n) => n + 1);
      setItems((prev) => [
        ...prev,
        {
          key,
          storage_path: path,
          alt_text: "",
          is_cover: prev.length === 0,
          preview,
        },
      ]);

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, file, { cacheControl: "31536000", upsert: false });

      setUploading((n) => n - 1);

      if (uploadError) {
        setError(`${file.name} could not be uploaded: ${uploadError.message}`);
        setItems((prev) => prev.filter((item) => item.key !== key));
        URL.revokeObjectURL(preview);
      } else {
        setItems((prev) =>
          prev.map((item) =>
            item.key === key ? { ...item, preview: undefined } : item,
          ),
        );
        URL.revokeObjectURL(preview);
      }
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  const move = (index: number, delta: number) =>
    setItems((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const setCover = (key: string) =>
    setItems((prev) => prev.map((item) => ({ ...item, is_cover: item.key === key })));

  const remove = (key: string) =>
    setItems((prev) => prev.filter((item) => item.key !== key));

  return (
    <div className="space-y-4">
      <input type="hidden" name="photos" value={JSON.stringify(payload)} />

      {items.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const src = item.preview ?? resolveImage(item.storage_path) ?? "";
            const isCover = payload[index].is_cover;

            return (
              <li
                key={item.key}
                className="overflow-hidden rounded-xl border border-line bg-white"
              >
                <div className="relative aspect-[4/3] bg-sand-deep">
                  <img
                    src={src}
                    alt={item.alt_text || "Gallery photo"}
                    className="h-full w-full object-cover"
                  />

                  {item.preview && (
                    <span className="absolute inset-0 flex items-center justify-center bg-ink/45 text-white">
                      <Loader2 size={22} className="animate-spin" strokeWidth={2} />
                    </span>
                  )}

                  {isCover && (
                    <span className="pill absolute top-2 left-2 bg-terracotta text-white">
                      <Star size={11} strokeWidth={2} fill="currentColor" />
                      Cover
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 p-3">
                  <input
                    className="input py-1.5 text-xs"
                    placeholder="Describe this photo (for accessibility)"
                    value={item.alt_text}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((p) =>
                          p.key === item.key ? { ...p, alt_text: e.target.value } : p,
                        ),
                      )
                    }
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <SmallButton
                        label="Move left"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ChevronLeft size={14} strokeWidth={1.75} />
                      </SmallButton>
                      <SmallButton
                        label="Move right"
                        disabled={index === items.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ChevronRight size={14} strokeWidth={1.75} />
                      </SmallButton>
                    </div>

                    <div className="flex gap-1">
                      <SmallButton
                        label="Make cover photo"
                        disabled={isCover}
                        onClick={() => setCover(item.key)}
                      >
                        <Star size={13} strokeWidth={1.75} />
                      </SmallButton>
                      <SmallButton
                        label="Remove photo"
                        danger
                        onClick={() => remove(item.key)}
                      >
                        <Trash2 size={13} strokeWidth={1.75} />
                      </SmallButton>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading > 0}
          className="btn btn-outline btn-sm w-full border-dashed py-6"
        >
          {uploading > 0 ? (
            <>
              <Loader2 size={15} className="animate-spin" strokeWidth={2} />
              Uploading {uploading} {uploading === 1 ? "photo" : "photos"}…
            </>
          ) : (
            <>
              <ImagePlus size={16} strokeWidth={1.6} />
              {items.length === 0 ? "Add photos" : "Add more photos"}
            </>
          )}
        </button>
        <p className="mt-2 text-xs text-ink-muted">
          JPEG, PNG, WebP or AVIF, up to 10 MB each. The first photo is used as the
          cover unless you star another one. Remember to save the form afterwards.
        </p>
      </div>

      {error && (
        <p className="flex items-start gap-2.5 rounded-lg bg-[#fbe1dc] px-3.5 py-3 text-sm text-[#a3402c]">
          <TriangleAlert size={16} strokeWidth={1.6} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function SmallButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-7 w-7 items-center justify-center rounded-md border border-line transition-colors disabled:opacity-30 ${
        danger
          ? "text-ink-muted hover:border-[#a3402c] hover:text-[#a3402c]"
          : "text-ink-muted hover:border-ink hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

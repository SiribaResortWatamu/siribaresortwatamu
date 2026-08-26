"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { BLUR_DATA_URL, resolveImage, sortPhotos } from "@/lib/images";
import type { Photo } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Gallery with a lightbox. Ordering comes from the CMS (cover first, then
 * `display_order`), so the owner controls what a guest sees first.
 */
export function Gallery({ photos, title }: { photos: Photo[]; title: string }) {
  const ordered = sortPhotos(photos).filter((p) => resolveImage(p.storage_path));
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (ordered.length === 0) return null;

  const [cover, ...rest] = ordered;
  const thumbs = rest.slice(0, 4);
  const extra = rest.length - thumbs.length;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        <GalleryTile
          photo={cover}
          title={title}
          priority
          onOpen={() => setLightbox(0)}
          className="lg:col-span-2 lg:row-span-2 lg:aspect-auto"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />

        {thumbs.map((photo, i) => (
          <GalleryTile
            key={photo.id}
            photo={photo}
            title={title}
            onOpen={() => setLightbox(i + 1)}
            sizes="(min-width: 1024px) 25vw, 50vw"
            badge={
              extra > 0 && i === thumbs.length - 1 ? `+${extra} more` : undefined
            }
          />
        ))}
      </div>

      {lightbox !== null && (
        <Lightbox
          photos={ordered}
          index={lightbox}
          title={title}
          onClose={() => setLightbox(null)}
          onIndexChange={setLightbox}
        />
      )}
    </>
  );
}

function GalleryTile({
  photo,
  title,
  onOpen,
  className,
  sizes,
  priority,
  badge,
}: {
  photo: Photo;
  title: string;
  onOpen: () => void;
  className?: string;
  sizes: string;
  priority?: boolean;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-sand-deep",
        className,
      )}
      aria-label={`Open ${photo.alt_text ?? title} in the gallery`}
    >
      <Image
        src={resolveImage(photo.storage_path)!}
        alt={photo.alt_text ?? title}
        fill
        sizes={sizes}
        priority={priority}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/20" />

      {badge ? (
        <span className="absolute inset-0 flex items-center justify-center bg-ink/55 font-display text-lg font-semibold text-white">
          {badge}
        </span>
      ) : (
        <span className="absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Expand size={14} strokeWidth={1.75} />
        </span>
      )}
    </button>
  );
}

function Lightbox({
  photos,
  index,
  title,
  onClose,
  onIndexChange,
}: {
  photos: Photo[];
  index: number;
  title: string;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const touchStart = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) => {
      onIndexChange((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onIndexChange],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [go, onClose]);

  const photo = photos[index];

  return (
    <div
      className="fixed inset-0 z-100 flex flex-col bg-ink/96 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} gallery`}
      // Swipe support on touch devices.
      onTouchStart={(e) => {
        touchStart.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
        touchStart.current = null;
      }}
    >
      <div className="flex items-center justify-between px-5 py-4 text-white/70">
        <span className="text-sm tabular-nums">
          {index + 1} / {photos.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close gallery"
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={22} strokeWidth={1.5} />
        </button>
      </div>

      <div className="relative flex-1">
        <Image
          key={photo.id}
          src={resolveImage(photo.storage_path)!}
          alt={photo.alt_text ?? title}
          fill
          sizes="100vw"
          className="animate-rise object-contain"
        />
      </div>

      <div className="flex items-center justify-center gap-6 px-5 py-6">
        <LightboxArrow label="Previous photo" onClick={() => go(-1)}>
          <ChevronLeft size={22} strokeWidth={1.5} />
        </LightboxArrow>
        <p className="max-w-md truncate text-center text-sm text-white/60">
          {photo.alt_text ?? title}
        </p>
        <LightboxArrow label="Next photo" onClick={() => go(1)}>
          <ChevronRight size={22} strokeWidth={1.5} />
        </LightboxArrow>
      </div>
    </div>
  );
}

function LightboxArrow({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white hover:text-ink"
    >
      {children}
    </button>
  );
}

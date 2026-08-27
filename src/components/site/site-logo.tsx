import Image from "next/image";
import { resolveImage } from "@/lib/images";
import { cn } from "@/lib/utils";

/**
 * The wordmark.
 *
 * Two artworks exist because the header sits transparent over the hero and
 * the footer is near-black: the dark logo vanishes on both. `variant` picks
 * the right one.
 *
 * The bundled files in /public are the brand. The settings columns are
 * overrides, so the owner can replace the logo from the dashboard without
 * a deploy — and if they only upload one, the other still falls back to a
 * file that exists rather than to nothing.
 */
export function SiteLogo({
  variant = "dark",
  logoPath,
  logoLightPath,
  propertyName,
  className,
  priority,
}: {
  /** "dark" = dark artwork for light backgrounds. "light" = reversed. */
  variant?: "dark" | "light";
  logoPath?: string | null;
  logoLightPath?: string | null;
  propertyName: string;
  className?: string;
  priority?: boolean;
}) {
  const override = variant === "light" ? logoLightPath : logoPath;
  const src = resolveImage(override) ?? (variant === "light" ? "/logo-light.png" : "/logo.png");

  return (
    <Image
      src={src}
      alt={propertyName}
      width={1200}
      height={313}
      priority={priority}
      // Intrinsic ratio is ~3.8:1; height is set by the caller and width follows.
      className={cn("w-auto object-contain", className)}
    />
  );
}

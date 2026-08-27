#!/usr/bin/env node
/**
 * Turn the two supplied logo files into the assets the site actually needs.
 *
 *   node scripts/build-brand-assets.mjs "<folder containing the logo PNGs>"
 *
 * Produces:
 *   public/logo.png         full wordmark, dark text  — for the sand header
 *   public/logo-light.png   full wordmark, white text — for the dark footer
 *   src/app/icon.png        512x512 sun mark, square  — Next builds the favicon
 *   src/app/apple-icon.png  180x180 sun mark on sand  — iOS home screen
 *
 * The favicon uses only the sun-and-waves mark: the full wordmark is
 * illegible at 32px, whereas the mark is square and reads at any size.
 */

import { readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const source = process.argv[2] ?? "C:/Users/liomu/Desktop/Siriba Images";
const files = readdirSync(source).filter((f) => f.toLowerCase().endsWith(".png"));

const dark = files.find((f) => /black/i.test(f));
const light = files.find((f) => /white/i.test(f));

if (!dark || !light) {
  console.error("Expected a '-black' and a '-white' PNG in", source);
  process.exit(1);
}

mkdirSync("public", { recursive: true });

// --- Full wordmarks -------------------------------------------------
// Kept at a generous width so they stay crisp on high-density screens;
// next/image serves them down from here.
for (const [file, out] of [
  [dark, "public/logo.png"],
  [light, "public/logo-light.png"],
]) {
  await sharp(join(source, file))
    .trim() // strip transparent margin so alignment is predictable
    .resize({ width: 1200, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(out);
  const { width, height } = await sharp(out).metadata();
  console.log(`${out}  ${width}x${height}`);
}

// --- The sun mark, for icons ---------------------------------------
// The mark sits in the left ~28% of the artwork. Crop generously, then
// trim back to the ink so the result is tight regardless of padding.
const src = sharp(join(source, dark));
const meta = await src.metadata();
const markWidth = Math.round(meta.width * 0.3);

const mark = await sharp(join(source, dark))
  .extract({ left: 0, top: 0, width: markWidth, height: meta.height })
  .trim()
  .toBuffer();

mkdirSync("src/app", { recursive: true });

/**
 * Scale the mark to fit a square, leaving a margin, then centre it.
 *
 * The mark has to be resized *before* compositing: sharp applies resize to
 * the base image earlier in its pipeline than composite, so scaling at the
 * end would try to paste an oversized mark onto a shrunken canvas.
 */
async function icon(size, background, out) {
  const inner = Math.round(size * 0.78); // ~11% margin on each side
  const scaled = await sharp(mark)
    .resize({
      width: inner,
      height: inner,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: scaled, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(out);

  console.log(`${out}  ${size}x${size}`);
}

// Transparent square — browsers render it on their own tab background.
await icon(512, { r: 0, g: 0, b: 0, alpha: 0 }, "src/app/icon.png");

// iOS ignores transparency, so this one gets the site's sand behind it.
await icon(180, { r: 246, g: 241, b: 233, alpha: 1 }, "src/app/apple-icon.png");

console.log("\nDone.");

/**
 * Image fingerprinting: SHA-256, perceptual dHash, angle count.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/digital-passport-artworks
 *   (index.html — dHashFromCanvas, sha256OfFile, orientationHistogram).
 *   Adapted for Node + browser parity: works on a plain RGBA buffer with
 *   no Canvas dependency. See docs/DECISIONS.md#adr-008.
 */
import { sha256 } from "@noble/hashes/sha2";

/** Minimal RGBA raster. Compatible with ImageData.data in browsers and
 *  with any decode library that emits raw pixels in Node. */
export interface RasterImage {
  width: number;
  height: number;
  /** RGBA interleaved, length = width * height * 4 */
  data: Uint8ClampedArray;
}

/** Convert RGBA RasterImage to a flat Float32Array of luma values [0..255]. */
export function toGrayscale(img: RasterImage): Float32Array {
  const { width, height, data } = img;
  const out = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const base = i * 4;
    out[i] =
      0.299 * (data[base] ?? 0) +
      0.587 * (data[base + 1] ?? 0) +
      0.114 * (data[base + 2] ?? 0);
  }
  return out;
}

/** SHA-256 of raw bytes, returned as lowercase hex. */
export function sha256Hex(bytes: Uint8Array): string {
  const digest = sha256(bytes);
  return Array.from(digest)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Perceptual difference hash — 64-bit, returned as 16-char lowercase hex.
 *
 * Algorithm (ported from dHashFromCanvas):
 *  1. Scale to 9×8 grayscale.
 *  2. For each row, compare each pixel to its right neighbour.
 *  3. Pack the 64 bits into 16 hex chars.
 */
export function dHash(img: RasterImage): string {
  const TARGET_W = 9;
  const TARGET_H = 8;

  // Simple nearest-neighbour resize to 9×8 grayscale
  const gray: number[] = [];
  for (let row = 0; row < TARGET_H; row++) {
    for (let col = 0; col < TARGET_W; col++) {
      const srcX = Math.min(
        Math.floor((col / TARGET_W) * img.width),
        img.width - 1,
      );
      const srcY = Math.min(
        Math.floor((row / TARGET_H) * img.height),
        img.height - 1,
      );
      const idx = (srcY * img.width + srcX) * 4;
      const r = img.data[idx] ?? 0;
      const g = img.data[idx + 1] ?? 0;
      const b = img.data[idx + 2] ?? 0;
      gray.push(0.299 * r + 0.587 * g + 0.114 * b);
    }
  }

  // Compute difference bits
  let bits = "";
  for (let row = 0; row < TARGET_H; row++) {
    for (let col = 0; col < TARGET_W - 1; col++) {
      const left = gray[row * TARGET_W + col] ?? 0;
      const right = gray[row * TARGET_W + col + 1] ?? 0;
      bits += left > right ? "1" : "0";
    }
  }

  // Pack 64 bits into 16 hex chars
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    hex += parseInt(bits.substring(i, i + 4), 2).toString(16);
  }
  return hex;
}

/**
 * Count dominant gradient orientation angles in the image.
 *
 * Computes a gradient orientation histogram (18 bins, 0–360°) over the
 * full image and returns the number of bins whose weight exceeds the mean —
 * a rough measure of structural complexity and a lightweight forensic proxy.
 * Higher counts indicate more edge variety; anomalously low counts can
 * indicate uniform-colour fills or other tampering artefacts.
 *
 * Ported from the orientation-histogram computation used in
 * digital-passport-artworks orientationHistogram().
 */
export function angleCount(img: RasterImage): number {
  const { width, height } = img;
  if (width < 3 || height < 3) return 0;

  const gray = toGrayscale(img);
  const BINS = 18;
  const hist = new Float32Array(BINS);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const gx =
        (gray[y * width + x + 1] ?? 0) - (gray[y * width + x - 1] ?? 0);
      const gy =
        (gray[(y + 1) * width + x] ?? 0) -
        (gray[(y - 1) * width + x] ?? 0);
      const mag = Math.hypot(gx, gy);
      if (mag < 1e-6) continue;
      let angle = Math.atan2(gy, gx);
      if (angle < 0) angle += 2 * Math.PI;
      const bin = Math.min(BINS - 1, Math.floor((angle / (2 * Math.PI)) * BINS));
      const prevBin = hist[bin];
      if (prevBin !== undefined) hist[bin] = prevBin + mag;
    }
  }

  // Count bins above the mean weight
  let total = 0;
  for (let i = 0; i < BINS; i++) total += hist[i] ?? 0;
  const mean = total / BINS;
  let count = 0;
  for (let i = 0; i < BINS; i++) {
    if ((hist[i] ?? 0) > mean) count++;
  }
  return count;
}

/**
 * Forensic signal fusion: spatial-inconsistency proxy (ELA-like), noise
 * floor, and spectral/edge energy. Returns structured ForensicSignal[]
 * plus a fused forgeryRisk score 0–100.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/digital-passport-artworks
 *   (index.html — elaBlockAnomaly, laplacianVariance, noiseFloor,
 *   hasProvenanceMarkers, and the fusion weights).
 *   The upstream ELA implementation requires Canvas JPEG recompression;
 *   the Node.js port replaces that with a blur-residual block-anomaly
 *   proxy that captures the same structural signal without browser APIs.
 *   All other thresholds, weights, and the upstream author's testing
 *   caveats are preserved verbatim. See docs/DECISIONS.md#adr-008.
 *
 * ============================================================
 * CRITICAL ARCHITECTURAL NOTE — THREE NUMBERS, NEVER COMBINED
 * ============================================================
 *
 *   forgeryRisk  (this module, 0–100)
 *     "Is this image what it claims to be? Are there signs of manipulation?"
 *
 *   confidenceScore  (@dpa/schema Passport.riskAssessment, 0–100)
 *     "How much sourced provenance evidence exists for this object?"
 *
 * These are SEPARATE measurements answering SEPARATE questions. A painting
 * with a low forgeryRisk but no ownership records has low confidenceScore.
 * A painting with a high forgeryRisk might have excellent provenance docs.
 * Folding forgeryRisk into confidenceScore would produce one number meaning
 * two things — the exact defect the coverage model was built to fix.
 *
 * forgeryRisk MUST NEVER be added to, averaged with, or otherwise merged
 * into confidenceScore. They live in different fields in the schema for
 * exactly this reason.
 * ============================================================
 */
import type { ForensicSignal } from "@dpa/schema";
import type { RasterImage } from "./fingerprint.js";
import { toGrayscale } from "./fingerprint.js";

/**
 * Laplacian variance — "spectral/edge energy" proxy.
 *
 * High variance = lots of sharp edges / high-frequency content.
 * Anomalously smooth regions relative to the image's own baseline can
 * indicate airbrushing, cloning, or uniform-colour fills.
 *
 * Upstream caveats (preserved): a 3× spread between two authentic photos
 * from subject-matter alone was observed in testing — low weight (10%).
 */
function laplacianVariance(gray: Float32Array, w: number, h: number): number {
  const lap: number[] = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const val =
        4 * (gray[idx] ?? 0) -
        (gray[idx - 1] ?? 0) -
        (gray[idx + 1] ?? 0) -
        (gray[idx - w] ?? 0) -
        (gray[idx + w] ?? 0);
      lap.push(val);
    }
  }
  if (lap.length === 0) return 0;
  const mean = lap.reduce((a, b) => a + b, 0) / lap.length;
  return lap.reduce((a, b) => a + (b - mean) ** 2, 0) / lap.length;
}

/**
 * Noise-floor consistency: high-pass residual standard deviation.
 *
 * Each pixel is compared to a 5-neighbour mean; high residual = noisy
 * or heavily sharpened. Authentic photos tend to have a consistent noise
 * signature across the frame; local patches with a very different noise
 * profile can indicate splicing.
 *
 * Upstream caveats (preserved): "also weak/confounded in testing; low
 * weight (10%)".
 */
function noiseFloor(gray: Float32Array, w: number, h: number): number {
  const residuals: number[] = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const blur =
        ((gray[idx - 1] ?? 0) +
          (gray[idx + 1] ?? 0) +
          (gray[idx - w] ?? 0) +
          (gray[idx + w] ?? 0) +
          (gray[idx] ?? 0)) /
        5;
      residuals.push((gray[idx] ?? 0) - blur);
    }
  }
  if (residuals.length === 0) return 0;
  const mean = residuals.reduce((a, b) => a + b, 0) / residuals.length;
  const variance =
    residuals.reduce((a, b) => a + (b - mean) ** 2, 0) / residuals.length;
  return Math.sqrt(variance);
}

/**
 * Spatial-inconsistency proxy — Node.js adaptation of upstream ELA.
 *
 * The upstream performs JPEG recompression via Canvas and measures
 * block-level absolute difference between original and recompressed pixels.
 * Without browser Canvas or a sharp dependency, this port instead uses
 * blur-residuals to approximate the same block-anomaly signal:
 *
 *  1. Compute per-pixel blur residuals (original − 3×3 average).
 *  2. Divide image into `cells × cells` blocks.
 *  3. Compute mean absolute residual per block.
 *  4. Return max/median ratio — a relative-to-self measure so content
 *     complexity doesn't dominate (same insight as the upstream's
 *     "relative to THIS image's own median block").
 *
 * Upstream test values preserved: ratio > 1.15 starts contributing risk;
 * ratio at 1.6 saturates to 1.0. See upstream comment for calibration.
 */
function spatialInconsistencyRatio(
  gray: Float32Array,
  w: number,
  h: number,
  cells = 8,
): number {
  // Build 3×3 box-blur
  const blur = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          sum += gray[(y + dy) * w + (x + dx)] ?? 0;
        }
      }
      blur[idx] = sum / 9;
    }
  }

  // Compute block mean absolute residuals
  const cellH = Math.floor(h / cells);
  const cellW = Math.floor(w / cells);
  if (cellH === 0 || cellW === 0) return 1;

  const blockMeans: number[] = [];
  for (let cy = 0; cy < cells; cy++) {
    for (let cx = 0; cx < cells; cx++) {
      let sum = 0;
      let n = 0;
      for (let y = cy * cellH; y < (cy + 1) * cellH; y++) {
        for (let x = cx * cellW; x < (cx + 1) * cellW; x++) {
          sum += Math.abs((gray[y * w + x] ?? 0) - (blur[y * w + x] ?? 0));
          n++;
        }
      }
      blockMeans.push(n > 0 ? sum / n : 0);
    }
  }

  const sorted = [...blockMeans].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0.001;
  const max = blockMeans.reduce((a, b) => Math.max(a, b), 0);
  return max / Math.max(median, 0.001);
}

export interface ForensicsResult {
  signals: ForensicSignal[];
  /**
   * Fused forgery-risk score, 0–100.
   *
   * SEPARATE from confidenceScore — see the module-level note.
   * Weights from upstream testing (spectral 10%, noise 10%, ELA 10%,
   * metadata markers 70%). The dominance of metadata is intentional: the
   * other three signals were each directly shown to be confounded by
   * innocent image variation across a small test set.
   */
  forgeryRisk: number;
}

/**
 * Compute forensic signals and fused forgery-risk score for an image.
 *
 * @param img    - RGBA raster to analyse.
 * @param hasExif  - whether the source bytes contain EXIF markers (0xFF 0xE1).
 * @param hasC2pa  - whether the source bytes contain C2PA/JUMBF markers.
 *
 * If the raw image bytes are available, pass them to `detectProvenanceMarkers`
 * first to get hasExif/hasC2pa. When only pixel data is available, pass
 * false for both — this raises the forgeryRisk moderately (no markers found),
 * which is the honest response.
 */
export function computeForensics(
  img: RasterImage,
  hasExif = false,
  hasC2pa = false,
): ForensicsResult {
  const { width: w, height: h } = img;
  const gray = toGrayscale(img);

  // 1. Spectral / edge energy (Laplacian variance)
  const lapVar = laplacianVariance(gray, w, h);
  // Upstream: risk is HIGH when variance is LOW (suspiciously smooth)
  // lapRiskSmooth = (200 - lapVar) / 200, clamped 0..1
  const lapRisk = Math.min(1, Math.max(0, (200 - lapVar) / 200));

  // 2. Noise-floor consistency
  const noise = noiseFloor(gray, w, h);
  // Upstream: risk when noise < 2.5 (too smooth / artificially cleaned)
  const noiseRisk = Math.min(1, Math.max(0, (2.5 - noise) / 2.5));

  // 3. Spatial inconsistency proxy (ELA-like)
  const elaRatio = spatialInconsistencyRatio(gray, w, h);
  // Upstream: (ratio - 1.15) / (1.6 - 1.15), clamped 0..1
  const elaRisk = Math.min(1, Math.max(0, (elaRatio - 1.15) / (1.6 - 1.15)));

  // 4. Provenance markers
  // Risk is HIGH when markers are absent (no accountability chain)
  const metaRisk = hasExif || hasC2pa ? 0.1 : 0.65;

  // Fusion — weights from upstream testing
  const weights = { ela: 0.1, spectral: 0.1, noise: 0.1, meta: 0.7 };
  const risk01 =
    elaRisk * weights.ela +
    lapRisk * weights.spectral +
    noiseRisk * weights.noise +
    metaRisk * weights.meta;
  const forgeryRisk = Math.round(risk01 * 100);

  const toSeverity = (
    v: number,
  ): "low" | "medium" | "high" =>
    v < 0.35 ? "low" : v < 0.65 ? "medium" : "high";

  const signals: ForensicSignal[] = [
    {
      name: "spectral_edge_energy",
      value: lapVar,
      interpretation: `Laplacian variance ${lapVar.toFixed(0)} — ${lapRisk < 0.35 ? "normal edge content" : "suspiciously smooth; may indicate cloning or airbrushing"}. Advisory only (10% weight) — 3× spread observed between authentic photos in upstream testing.`,
      severity: toSeverity(lapRisk),
    },
    {
      name: "noise_floor",
      value: noise,
      interpretation: `High-pass residual σ ${noise.toFixed(2)} — ${noiseRisk < 0.35 ? "consistent noise signature" : "unusually low noise; may indicate heavy processing or content replacement"}. Advisory only (10% weight) — confounded by subject matter in upstream testing.`,
      severity: toSeverity(noiseRisk),
    },
    {
      name: "ela_spatial_inconsistency",
      value: elaRatio,
      interpretation: `Blur-residual block-anomaly ratio ${elaRatio.toFixed(2)}× (max/median). ${elaRisk < 0.35 ? "No anomalous block detected." : "One or more blocks have anomalously high residuals relative to this image's own median."} Node.js proxy for upstream ELA (JPEG-recompression not available). Advisory only (10% weight).`,
      severity: toSeverity(elaRisk),
    },
    {
      name: "provenance_markers",
      value: hasExif ? (hasC2pa ? 1.0 : 0.7) : hasC2pa ? 0.7 : 0.0,
      interpretation: `${hasExif ? "EXIF " : ""}${hasC2pa ? "C2PA/JUMBF " : ""}${hasExif || hasC2pa ? "markers present" : "No provenance markers found (EXIF/C2PA). Absence raises risk moderately."}. Dominant signal (70% weight) — the only one not falsified in upstream testing.`,
      severity: hasExif || hasC2pa ? "low" : "medium",
    },
  ];

  return { signals, forgeryRisk };
}

/**
 * Scan raw image bytes for EXIF (0xFF 0xE1) and C2PA (JUMBF 'jumb' marker)
 * provenance markers. Port of hasProvenanceMarkers from upstream.
 */
export function detectProvenanceMarkers(bytes: Uint8Array): {
  hasExif: boolean;
  hasC2pa: boolean;
} {
  let hasExif = false;
  let hasC2pa = false;
  for (let i = 0; i < bytes.length - 1; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xe1) {
      hasExif = true;
      break;
    }
  }
  // Scan the first 200KB for C2PA markers
  const scanLen = Math.min(bytes.length, 200_000);
  const latin1 = String.fromCharCode(...bytes.subarray(0, scanLen));
  if (
    latin1.includes("jumb") ||
    latin1.includes("c2pa") ||
    latin1.includes("C2PA")
  ) {
    hasC2pa = true;
  }
  return { hasExif, hasC2pa };
}

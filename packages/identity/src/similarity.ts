/**
 * Perceptual-hash similarity: Hamming distance, similarity score, verdict.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/digital-passport-artworks
 *   (index.html — hammingHex, evaluateSimilarity).
 *   Thresholds preserved from the upstream; documented below.
 * See docs/DECISIONS.md#adr-008.
 */

/**
 * Hamming distance between two equal-length hex strings.
 * Ported directly from upstream hammingHex — nibble-by-nibble XOR popcount.
 */
export function hammingDistance(hexA: string, hexB: string): number {
  if (hexA.length !== hexB.length) {
    throw new Error(
      `hammingDistance: hex strings must be equal length (${hexA.length} vs ${hexB.length})`,
    );
  }
  let dist = 0;
  for (let i = 0; i < hexA.length; i++) {
    let x = parseInt(hexA[i] ?? "0", 16) ^ parseInt(hexB[i] ?? "0", 16);
    while (x) {
      dist += x & 1;
      x >>= 1;
    }
  }
  return dist;
}

/**
 * Similarity in [0, 1] derived from dHash Hamming distance over 64 bits.
 * 1.0 = identical; 0.0 = maximally different.
 */
export function dHashSimilarity(hexA: string, hexB: string): number {
  const dist = hammingDistance(hexA, hexB);
  return 1 - dist / 64;
}

/**
 * Verdict thresholds, preserved from upstream digital-passport-artworks:
 *
 *  distance ≤ 4  (similarity ≥ 0.9375) → "duplicate"
 *    — same photograph, minor re-encoding, crop, or colour tweak.
 *  distance ≤ 12 (similarity ≥ 0.8125) → "possible-duplicate"
 *    — visually similar, may be same work photographed differently.
 *  distance >  12                        → "distinct"
 *    — different works or wildly different images.
 *
 * These were calibrated against the upstream test set (255 inliers on a
 * simulated angle-change of the same painting; 0 on every unrelated pair).
 */
export type SimilarityVerdict = "duplicate" | "possible-duplicate" | "distinct";

const THRESHOLD_DUPLICATE = 4;
const THRESHOLD_POSSIBLE_DUPLICATE = 12;

export function compare(
  hexA: string,
  hexB: string,
): { similarityScore: number; verdict: SimilarityVerdict } {
  const dist = hammingDistance(hexA, hexB);
  const similarityScore = 1 - dist / 64;
  let verdict: SimilarityVerdict;
  if (dist <= THRESHOLD_DUPLICATE) {
    verdict = "duplicate";
  } else if (dist <= THRESHOLD_POSSIBLE_DUPLICATE) {
    verdict = "possible-duplicate";
  } else {
    verdict = "distinct";
  }
  return { similarityScore, verdict };
}

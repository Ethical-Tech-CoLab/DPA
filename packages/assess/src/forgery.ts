/**
 * Forgery-risk scorer — fuses forensic signals into a single 0–100 score.
 *
 * PROVENANCE: new for DPA v0.4. The signal schema is ported from
 *   Ethical-Tech-CoLab/digital-passport-artworks (@ChristineLumen).
 *   See docs/DECISIONS.md#adr-003.
 *
 * CRITICAL SEPARATION: forgery risk is a completely different question from
 * provenance confidence. `confidenceScore` asks "was this looted?".
 * `forgeryRisk` asks "is the image what it claims to be?". These are
 * independent questions on the same 0–100 scale. They must never be merged,
 * averaged, or otherwise combined into a single number. A forgery that was
 * cleanly documented is still a forgery; an authentic work with thin records
 * is still authentic. Keeping them apart is not a presentation choice — it is
 * the only way either number means anything.
 *
 * This module MUST NOT import scorer.ts or coverage.ts.
 */

import type { ForensicSignal } from "@dpa/schema";

export interface ForgeryRiskResult {
  score: number;
  signals: ForensicSignal[];
}

const SEVERITY_WEIGHT: Record<ForensicSignal["severity"], number> = {
  low: 1,
  medium: 2,
  high: 4,
};

/**
 * Fuse an array of forensic signals into a single forgery-risk score (0–100).
 *
 * Each signal contributes a severity-weighted fraction of its `value`
 * (interpreted as 0–1 probability / normalised risk). High-severity signals
 * count four times as much as low-severity ones, reflecting that high-severity
 * findings (e.g. perceptual-hash mismatch) are the primary concern.
 *
 * Returns 0 when no signals are provided — "no evidence of forgery" is
 * different from "evidence of clean object", but the absence of a forensic
 * programme should not fabricate a positive or negative score.
 */
export function computeForgeryRisk(signals: ForensicSignal[]): ForgeryRiskResult {
  if (signals.length === 0) {
    return { score: 0, signals: [] };
  }

  let weightedSum = 0;
  let totalWeight = 0;

  for (const sig of signals) {
    const w = SEVERITY_WEIGHT[sig.severity];
    // Clamp value to [0, 1]: the schema does not constrain it but the fusion
    // arithmetic assumes a fractional input.
    const v = Math.max(0, Math.min(1, sig.value));
    weightedSum += w * v;
    totalWeight += w;
  }

  const raw = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  return { score, signals };
}

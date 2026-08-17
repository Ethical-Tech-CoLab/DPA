/**
 * Top-level assessment orchestrator — calls all three independent scorers and
 * assembles the result that maps onto Passport["riskAssessment"].
 *
 * PROVENANCE: new for DPA v0.4. Orchestrates the three canonical scorers;
 *   see docs/DECISIONS.md#adr-002, #adr-003.
 *
 * THREE NUMBERS, NEVER COMBINED:
 *   confidenceScore  — how much sourced provenance evidence exists (0–100)
 *   coverageClass    — whether that evidence COULD have existed
 *   forgeryRisk      — whether the image is what it claims to be (0–100)
 *
 * This function calls scoreProvenance, computeCoverage, and computeForgeryRisk
 * independently. None of their outputs is fed into another as input.
 * The structural independence (ADR-003) is enforced at the import level:
 *   scorer.ts   — never imports coverage.ts
 *   coverage.ts — never imports scorer.ts
 *   forgery.ts  — never imports scorer.ts or coverage.ts
 * assess.ts is the ONLY file that imports all three.
 */

import type { AcquisitionMode, Coverage, ForensicSignal, RiskFlag } from "@dpa/schema";
import { scoreProvenance, type ScorerInput, type RegistrySummary, type BreakdownEntry } from "./scorer.js";
import { computeCoverage, type CoverageInput } from "./coverage.js";
import { computeForgeryRisk, type ForgeryRiskResult } from "./forgery.js";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type { RegistrySummary };

export interface AssessInput {
  timeline: ScorerInput["timeline"];
  // Scoring inputs
  registry?: RegistrySummary | null;
  premiumResult?: ScorerInput["premiumResult"];
  valuation?: ScorerInput["valuation"];
  cryptoFlag?: RiskFlag | null;
  // Coverage inputs (independent of scoring)
  region?: string | null;
  corpus?: string;
  acquisitionMode?: AcquisitionMode;
  /** Whether the object was recorded before removal. See CoverageInput. */
  everInventoried?: boolean;
  // Forensic inputs (independent of provenance scoring)
  forensicSignals?: ForensicSignal[];
}

export interface AssessResult {
  confidenceScore: number;
  coverage: Coverage;
  flags: RiskFlag[];
  scorer: "accumulation-v0.4";
  /**
   * Ordered scoring steps. Carried out of the assessment so a reader can
   * recompute the number by hand — an unauditable score is a rumour.
   */
  breakdown: BreakdownEntry[];
  /** Forgery risk lives outside riskAssessment (see ObjectIdentity). Provided here
   *  for pipelines that compute it alongside the provenance assessment. */
  forgeryRisk: ForgeryRiskResult;
}

/* -------------------------------------------------------------------------- */
/* Orchestrator                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Run all three independent assessments and assemble the result.
 *
 * The returned `{ confidenceScore, coverage, flags, scorer }` sub-object is
 * structurally identical to `Passport["riskAssessment"]`.
 */
export function assess(input: AssessInput): AssessResult {
  // ── 1. Provenance confidence score ───────────────────────────────────────
  //    scorer.ts only; never sees coverage or forgery inputs
  const scored = scoreProvenance({
    timeline: input.timeline,
    registry: input.registry,
    premiumResult: input.premiumResult,
    valuation: input.valuation,
    cryptoFlag: input.cryptoFlag,
  });

  // ── 2. Evidence coverage ─────────────────────────────────────────────────
  //    coverage.ts only; never sees the confidence score or forgery inputs
  const coverageInput: CoverageInput = {
    region: input.region,
    corpus: input.corpus,
    mode: input.acquisitionMode,
    everInventoried: input.everInventoried,
  };
  const coverage = computeCoverage(coverageInput);

  // ── 3. Forgery risk ──────────────────────────────────────────────────────
  //    forgery.ts only; never sees provenance score or coverage
  const forgeryRisk = computeForgeryRisk(input.forensicSignals ?? []);

  // ── 4. Augment flags from the timeline ───────────────────────────────────
  const flags: RiskFlag[] = [...scored.flags];

  // Unsourced assertions: any timeline event backed only by model general
  // knowledge rather than a retrieved document. Such claims may never be
  // presented as verified. The flag is medium-severity per ADR-008.
  for (const event of input.timeline) {
    if (event.isGeneralKnowledge) {
      flags.push({
        type: "unsourcedAssertion",
        severity: "medium",
        evidence: `Timeline event "${event.event}" is marked as general knowledge rather than a retrieved document. It cannot be treated as a verified claim.`,
        source: event.source,
      });
    }
  }

  return {
    confidenceScore: scored.confidenceScore,
    coverage,
    flags,
    scorer: "accumulation-v0.4",
    breakdown: scored.breakdown,
    forgeryRisk,
  };
}

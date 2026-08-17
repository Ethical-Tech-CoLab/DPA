/**
 * @dpa/assess — provenance assessment package for DPA v0.4.
 *
 * ---------------------------------------------------------------------------
 * THREE NUMBERS, NEVER COMBINED.
 *
 *   confidenceScore  — how much sourced provenance evidence exists (0–100)
 *   coverageClass    — whether that evidence COULD have existed
 *   forgeryRisk      — whether the image is what it claims to be (0–100)
 *
 * Folding coverage into the confidence score would produce one number meaning
 * two things, which is the defect the coverage model exists to fix. The same
 * low score means opposite things in different coverage classes:
 *
 *   structurally-uncovered: "the registers could never look here — the score
 *     measures our blindness, not the object"
 *   well-covered: "the registers looked and found very little — the score
 *     measures the object"
 *
 * The lower number from a well-covered object is therefore the MORE informative
 * result: it says "records ought to exist here and they are thin." The same low
 * number from a structurally-uncovered object says nothing about the object at
 * all. Both must be reported; neither may be reported without the other.
 *
 * Merging forgery risk with provenance confidence conflates "is this a fake?"
 * with "was this looted?" — unrelated questions on the same scale.
 *
 * COMPARABILITY RULE: a confidence score is comparable only to other objects
 * in the same coverage class. Ranking objects across coverage classes by score
 * is an analytical error. Use `areComparable(a, b)` before comparing.
 * ---------------------------------------------------------------------------
 *
 * CANONICAL SCORER: accumulation-v0.4 (ADR-002).
 * Two deduction-based scorers retired in v0.4:
 *   arts-provenance-agent/src/web/pipeline.ts — deduction from 100
 *   provenance-search/server.js computeConfidenceScore — deduction from 100
 * ---------------------------------------------------------------------------
 */

export { scoreProvenance } from "./scorer.js";
export type { ScorerInput, ScorerResult, BreakdownEntry, RegistrySummary, RegistryHit, RegistryCheck } from "./scorer.js";

export { computeCoverage, areComparable, scoreIsUninformative, REGISTER_SCOPES, WESTERN_MARKET, SOURCE_COUNTRY_REGIONS } from "./coverage.js";
export type { CoverageInput } from "./coverage.js";

export { computeForgeryRisk } from "./forgery.js";
export type { ForgeryRiskResult } from "./forgery.js";

export { assess } from "./assess.js";
export type { AssessInput, AssessResult } from "./assess.js";

export { explainScore } from "./explain.js";
export type { ExplainInput } from "./explain.js";

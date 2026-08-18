/**
 * @dpa/capture — Stage 0.
 *
 * The only stage in the pipeline that creates record rather than querying it.
 * See docs/DECISIONS.md#adr-010 and docs/CAPTURE-PROTOCOL.md.
 */

export {
  METRIC_SPECS,
  METRIC_BY_ID,
  QUALITY_CLASS_ORDER,
  CLASS_MEANING,
  classRank,
  worstClass,
  permittedClass,
} from "./rubric.js";
export type { MetricSpec } from "./rubric.js";

export { assessCapture } from "./assess.js";
export type { CaptureMeasurements, AssessOptions } from "./assess.js";

export { advise } from "./guidance.js";
export type {
  LiveGuidance,
  LiveSignal,
  SignalState,
  AdviseOptions,
} from "./guidance.js";

export {
  buildCaptureRecord,
  buildAttestation,
  buildNonAttestation,
  defaultTier,
  evaluateChain,
  LEGITIMACY_DISCLAIMER,
} from "./record.js";
export type { BuildCaptureInput, MaterialSensitivity } from "./record.js";

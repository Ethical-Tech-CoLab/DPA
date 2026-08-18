/**
 * Rate a completed capture.
 *
 * ---------------------------------------------------------------------------
 * THE SCORING MODEL, AND WHY IT IS NOT THE PROVENANCE SCORER.
 *
 * `@dpa/assess` scores provenance confidence by ACCUMULATION: it starts at a
 * floor and adds for each piece of corroborating evidence, because evidence
 * genuinely does add up. Two independent archival records are better than one.
 *
 * Capture quality does not work that way. Four hundred photographs that are all
 * out of focus produce an out-of-focus mesh. A capture with flawless angular
 * coverage, flawless overlap, flawless lighting and no scale bar is a capture
 * of an object whose size is unknown, and no amount of the other four buys that
 * back. Quality is bounded by its weakest dimension, so the CLASS IS THE
 * MINIMUM ACROSS METRICS, never the average.
 *
 * This is why the rubric reports a limiting metric. There is always exactly one
 * thing worth fixing next, and averaging would hide it — which is the specific
 * failure mode of every five-star rating a contributor has ever been shown.
 *
 * TWO NUMBERS, TWO QUESTIONS. `qualityClass` answers "what may I use this for?"
 * and is authoritative. `qualityScore` answers "am I getting better?" — it is
 * the mean of the normalised metrics and exists so a contributor re-shooting a
 * session can see movement before the class flips over. The class governs; the
 * score motivates. They are deliberately allowed to disagree, and
 * `assess.test.ts` locks in a case where the score is high and the class is not,
 * so nobody later "fixes" that into a single misleading number.
 *
 * ADR-010 STRUCTURAL ENFORCEMENT. This module MUST NOT import from
 * `@dpa/assess`, and `@dpa/assess` MUST NOT import from here. Neither takes the
 * other's output as input. A museum must not be able to raise an object's
 * provenance confidence by buying a better camera, and the way to guarantee
 * that is to make the two numbers physically unable to reach each other.
 * ---------------------------------------------------------------------------
 */

import type {
  CaptureMetric,
  CaptureMetricId,
  CaptureQuality,
  CaptureQualityClass,
  CaptureMethod,
} from "@dpa/schema";
import {
  CLASS_MEANING,
  METRIC_SPECS,
  classRank,
  permittedClass,
  worstClass,
} from "./rubric.js";

/** Raw measurements from a capture session, keyed by metric. */
export type CaptureMeasurements = Partial<Record<CaptureMetricId, number>>;

export interface AssessOptions {
  method: CaptureMethod;
}

/**
 * A metric that was never measured is NOT treated as passing.
 *
 * This is the same discipline as ADR-009: silence is not a clear result. If a
 * session reports no scale reference because the app never checked, the honest
 * reading is that the object's size is unknown — identical to having checked
 * and found none. Defaulting unmeasured metrics to zero makes the omission
 * visible instead of letting it inflate the class.
 */
const UNMEASURED = 0;

export function assessCapture(
  measurements: CaptureMeasurements,
  options: AssessOptions,
): CaptureQuality {
  const metrics: CaptureMetric[] = METRIC_SPECS.map((spec) => {
    const raw = measurements[spec.id];
    const measured = raw === undefined ? UNMEASURED : raw;
    const value = spec.normalise(measured);
    return {
      id: spec.id,
      label: spec.label,
      value,
      measured:
        raw === undefined ? "not measured" : spec.format(raw),
      permits: permittedClass(spec, value),
      why: spec.why,
    };
  });

  let qualityClass: CaptureQualityClass = "reference";
  for (const m of metrics) {
    qualityClass = worstClass(qualityClass, m.permits);
  }

  const limiting = limitingMetric(metrics, qualityClass);

  const qualityScore = Math.round(
    (metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length) * 100,
  );

  return {
    qualityClass,
    qualityScore,
    metrics,
    limitingMetric: limiting,
    note: buildNote(qualityClass, limiting, metrics),
    comparability: `Comparable only to other ${options.method} captures. A LiDAR capture and a phone photogrammetry capture that both score ${qualityScore} are not equivalent records, because the failure modes differ: LiDAR resolves geometry without texture detail, photogrammetry the reverse.`,
  };
}

/**
 * The metric worth fixing next.
 *
 * Among those sitting at the limiting class, pick the one furthest below the
 * threshold it needs to clear — i.e. the one actually pinning the class down,
 * not merely one that happens to share its band.
 */
function limitingMetric(
  metrics: CaptureMetric[],
  qualityClass: CaptureQualityClass,
): CaptureMetricId | null {
  if (qualityClass === "reference") return null;

  const atLimit = metrics.filter((m) => m.permits === qualityClass);
  if (atLimit.length === 0) return null;

  const nextClass = nextClassUp(qualityClass);
  let worstMetric = atLimit[0]!;
  let worstDeficit = Number.NEGATIVE_INFINITY;

  for (const m of atLimit) {
    const spec = METRIC_SPECS.find((s) => s.id === m.id)!;
    const needed = thresholdFor(spec.thresholds, nextClass);
    const deficit = needed - m.value;
    if (deficit > worstDeficit) {
      worstDeficit = deficit;
      worstMetric = m;
    }
  }
  return worstMetric.id;
}

function nextClassUp(c: CaptureQualityClass): CaptureQualityClass {
  const order: CaptureQualityClass[] = [
    "insufficient",
    "indicative",
    "study",
    "reference",
  ];
  const idx = classRank(c);
  return order[Math.min(idx + 1, order.length - 1)]!;
}

function thresholdFor(
  thresholds: { reference: number; study: number; indicative: number },
  c: CaptureQualityClass,
): number {
  if (c === "reference") return thresholds.reference;
  if (c === "study") return thresholds.study;
  if (c === "indicative") return thresholds.indicative;
  return 0;
}

function buildNote(
  qualityClass: CaptureQualityClass,
  limiting: CaptureMetricId | null,
  metrics: CaptureMetric[],
): string {
  const meaning = CLASS_MEANING[qualityClass];
  if (limiting === null) return meaning;

  const spec = METRIC_SPECS.find((s) => s.id === limiting)!;
  const unmeasured = metrics.filter((m) => m.measured === "not measured");
  const unmeasuredNote =
    unmeasured.length > 0
      ? ` ${unmeasured.length} of ${metrics.length} dimensions were never measured and are counted as absent, not as passing.`
      : "";

  return `${meaning} The dimension currently holding this back is ${spec.label.toLowerCase()}.${unmeasuredNote}`;
}

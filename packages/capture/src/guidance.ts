/**
 * Real-time capture guidance.
 *
 * ---------------------------------------------------------------------------
 * WHAT AABC ASKED FOR: "help consumers clearly understand how their inputs are
 * rated in terms of scan quality. In real time we should [have] ways to help
 * them understand adjustments they need to make."
 *
 * THE CONSTRAINT NOBODY MENTIONS. Half of what determines a capture's quality
 * cannot be known until the photographs have been processed. Reprojection
 * error, mesh watertightness and point-cloud density are outputs of
 * reconstruction, which happens minutes to hours later and often on a different
 * machine. Guidance built on those quantities is not real-time advice, it is a
 * post-mortem — and a contributor who has packed up and gone home cannot act
 * on it.
 *
 * So this module only ever reads metrics flagged `liveMeasurable`. Everything
 * else is reported as DEFERRED, explicitly, so the contributor knows the
 * session can still fail an acceptance check they cannot see yet. Pretending
 * otherwise would be the more comfortable design and the dishonest one.
 *
 * ONE INSTRUCTION AT A TIME. Apple's ObjectCaptureSession — the only mobile
 * capture API with publicly documented real-time quality signals — shows a
 * single corrective message at a time (move slower, too far, more light,
 * object out of frame) against a segmented dial. That is not a UI preference.
 * Somebody walking backwards around a plinth holding a phone can act on one
 * instruction. Presenting ten metrics and inviting them to optimise is how you
 * produce a contributor who ignores all ten.
 *
 * STABILITY MATTERS MORE THAN PRECISION. Two metrics hovering near the same
 * threshold will otherwise swap the headline instruction several times a
 * second, which reads as malfunction and is impossible to obey. `advise()`
 * accepts the previous instruction and keeps it unless something is clearly
 * worse, so guidance changes when the situation changes rather than when the
 * arithmetic wobbles.
 * ---------------------------------------------------------------------------
 */

import type { CaptureMetricId, CaptureQualityClass } from "@dpa/schema";
import type { CaptureMeasurements } from "./assess.js";
import {
  METRIC_SPECS,
  classRank,
  permittedClass,
  worstClass,
} from "./rubric.js";

/** How a single dimension is doing, right now. */
export type SignalState =
  /** Meets the target class. */
  | "ok"
  /** Usable, but below the target class. */
  | "attention"
  /** Would make the capture unacceptable at any class. */
  | "blocking"
  /** Not yet measured this session. */
  | "unknown";

export interface LiveSignal {
  id: CaptureMetricId;
  label: string;
  state: SignalState;
  value: number;
  measured: string;
  permits: CaptureQualityClass;
}

export interface LiveGuidance {
  /** What the capture would be rated if the contributor stopped now. */
  provisionalClass: CaptureQualityClass;
  /** The single thing to do next. Null when the target is already met. */
  primaryAction: string | null;
  primaryMetric: CaptureMetricId | null;
  signals: LiveSignal[];
  /**
   * Dimensions that cannot be judged until reconstruction. Surfaced so the
   * contributor is not told "all good" by a system that has not looked at
   * everything.
   */
  deferred: CaptureMetricId[];
  /** True when the session meets the target class on every live dimension. */
  meetsTarget: boolean;
  /** Plain-language summary suitable for a status line. */
  summary: string;
}

export interface AdviseOptions {
  /** The class the contributor is aiming for. Defaults to `study`. */
  target?: CaptureQualityClass;
  /**
   * The metric currently being advised on, if any. Passing it back in keeps
   * the instruction stable across frames.
   */
  previousMetric?: CaptureMetricId | null;
  /**
   * How much worse a competing metric must be before the headline instruction
   * switches. In normalised units.
   */
  hysteresis?: number;
}

const DEFAULT_HYSTERESIS = 0.08;

export function advise(
  measurements: CaptureMeasurements,
  options: AdviseOptions = {},
): LiveGuidance {
  const target = options.target ?? "study";
  const hysteresis = options.hysteresis ?? DEFAULT_HYSTERESIS;

  const liveSpecs = METRIC_SPECS.filter((s) => s.liveMeasurable);
  const deferred = METRIC_SPECS.filter((s) => !s.liveMeasurable).map(
    (s) => s.id,
  );

  const signals: LiveSignal[] = liveSpecs.map((spec) => {
    const raw = measurements[spec.id];
    if (raw === undefined) {
      return {
        id: spec.id,
        label: spec.label,
        state: "unknown" as SignalState,
        value: 0,
        measured: "not measured",
        permits: "insufficient" as CaptureQualityClass,
      };
    }
    const value = spec.normalise(raw);
    const permits = permittedClass(spec, value);
    const state: SignalState =
      permits === "insufficient"
        ? "blocking"
        : classRank(permits) < classRank(target)
          ? "attention"
          : "ok";
    return {
      id: spec.id,
      label: spec.label,
      state,
      value,
      measured: spec.format(raw),
      permits,
    };
  });

  let provisionalClass: CaptureQualityClass = "reference";
  for (const s of signals) {
    provisionalClass = worstClass(provisionalClass, s.permits);
  }

  const candidate = pickPrimary(signals, target, options.previousMetric ?? null, hysteresis);

  const meetsTarget =
    signals.length > 0 &&
    signals.every(
      (s) => s.state !== "unknown" && classRank(s.permits) >= classRank(target),
    );

  return {
    provisionalClass,
    primaryAction: candidate
      ? METRIC_SPECS.find((s) => s.id === candidate)!.guidance
      : null,
    primaryMetric: candidate,
    signals,
    deferred,
    meetsTarget,
    summary: buildSummary(provisionalClass, target, meetsTarget, deferred.length),
  };
}

/**
 * The metric to advise on.
 *
 * Anything blocking outranks anything merely below target, because a blocking
 * dimension makes the whole session unusable however good the rest is. Within
 * a rank, the largest shortfall wins. The previously advised metric is kept
 * unless a competitor is worse by more than the hysteresis margin.
 */
function pickPrimary(
  signals: LiveSignal[],
  target: CaptureQualityClass,
  previous: CaptureMetricId | null,
  hysteresis: number,
): CaptureMetricId | null {
  const actionable = signals.filter(
    (s) => s.state === "blocking" || s.state === "attention" || s.state === "unknown",
  );
  if (actionable.length === 0) return null;

  const shortfall = (s: LiveSignal): number => {
    const spec = METRIC_SPECS.find((m) => m.id === s.id)!;
    const needed =
      target === "reference"
        ? spec.thresholds.reference
        : target === "study"
          ? spec.thresholds.study
          : spec.thresholds.indicative;
    const blockingBonus = s.state === "blocking" || s.state === "unknown" ? 1 : 0;
    return blockingBonus + (needed - s.value);
  };

  let best = actionable[0]!;
  for (const s of actionable) {
    if (shortfall(s) > shortfall(best)) best = s;
  }

  if (previous !== null) {
    const prev = actionable.find((s) => s.id === previous);
    if (prev && shortfall(best) - shortfall(prev) < hysteresis) {
      return prev.id;
    }
  }
  return best.id;
}

function buildSummary(
  provisional: CaptureQualityClass,
  target: CaptureQualityClass,
  meetsTarget: boolean,
  deferredCount: number,
): string {
  const deferredNote =
    deferredCount > 0
      ? ` ${deferredCount} further ${deferredCount === 1 ? "check runs" : "checks run"} after processing and cannot be judged here.`
      : "";

  if (meetsTarget) {
    return `On the dimensions measurable during capture, this session currently meets ${target}.${deferredNote}`;
  }
  if (provisional === "insufficient") {
    return `This session would not currently be accepted.${deferredNote}`;
  }
  return `This session would currently be rated ${provisional}; you are aiming for ${target}.${deferredNote}`;
}

/**
 * The capture rubric.
 *
 * TEN measurable dimensions of a photogrammetric capture, each with the raw
 * quantity it measures, the bands that map it onto a fitness class, and the
 * single sentence a contributor is shown when it is the thing holding them back.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS IS GROUNDED IN, AND WHAT IT IS NOT.
 *
 * There is no universally accepted numerical rubric for cultural-heritage 3D
 * capture. We looked. The London Charter (2009) is the most widely adopted
 * normative framework and is a PRINCIPLES document with no numeric tiers.
 * Historic England, the Smithsonian DPO and Europeana have each proposed their
 * own; none is a ratified cross-body standard, and several were not publicly
 * retrievable when we checked.
 *
 * So the individual MEASURES here are standard practice and defensible:
 *   - variance of the Laplacian and Tenengrad as focus measures,
 *   - histogram clipping fractions for exposure,
 *   - 60–80% image overlap for close-range heritage photogrammetry (CIPA),
 *   - ground sample distance in mm/pixel,
 *   - angular sector coverage, which is what Apple's capture dial discretises.
 *
 * The BANDS — where reference ends and study begins — are ours. They are
 * calibrated to be achievable on a mid-range phone by a museum registrar with
 * no photogrammetry training, because that is the population the protocol is
 * for. They are a starting point for negotiation with AABC and the standards
 * bodies, not a claim of authority. Every threshold is in one place, in this
 * file, so that argument can be had against specific numbers.
 *
 * THE LONDON CHARTER IS THE REASON THIS FILE EXISTS IN THIS SHAPE. Its core
 * requirement is that a visualisation "accurately convey to users the status of
 * the knowledge they represent, such as distinctions between evidence and
 * hypothesis, and between different levels of probability." A 3D model shown
 * without its capture quality does not do that. Neither does one shown with a
 * single unexplained number.
 * ---------------------------------------------------------------------------
 */

import type {
  CaptureMetricId,
  CaptureQualityClass,
} from "@dpa/schema";

/* -------------------------------------------------------------------------- */
/* Class ordering                                                              */
/* -------------------------------------------------------------------------- */

/** Ascending. `insufficient` is the floor. */
export const QUALITY_CLASS_ORDER: CaptureQualityClass[] = [
  "insufficient",
  "indicative",
  "study",
  "reference",
];

export function classRank(c: CaptureQualityClass): number {
  return QUALITY_CLASS_ORDER.indexOf(c);
}

export function worstClass(
  a: CaptureQualityClass,
  b: CaptureQualityClass,
): CaptureQualityClass {
  return classRank(a) <= classRank(b) ? a : b;
}

export const CLASS_MEANING: Record<CaptureQualityClass, string> = {
  reference:
    "Fit to serve as the identifying record of this object. Measurable, colour-accurate, and complete enough that a future capture can be compared against it to detect change or substitution.",
  study:
    "Fit for scholarly comparison and condition assessment. Not fit to be the sole identifying record — a determined substitution could survive comparison against it.",
  indicative:
    "Fit to display. Not fit to measure, compare or identify against. Shows what the object looks like; proves nothing about it.",
  insufficient:
    "Not fit to accept. Recording it as an object record would misrepresent what is actually known.",
};

/* -------------------------------------------------------------------------- */
/* Metric specifications                                                       */
/* -------------------------------------------------------------------------- */

export interface MetricSpec {
  id: CaptureMetricId;
  label: string;
  unit: string;
  /** Why this matters for a CULTURAL object specifically. Shown to the user. */
  why: string;
  /**
   * The normalised value required to permit each class. Below `indicative`
   * the metric permits only `insufficient`.
   */
  thresholds: { reference: number; study: number; indicative: number };
  /** Normalise the raw measurement onto 0–1. */
  normalise: (raw: number) => number;
  /** Render the raw measurement for a human. */
  format: (raw: number) => string;
  /**
   * What to do about it, in the imperative, addressed to whoever is holding
   * the phone. This is the real-time guidance string.
   */
  guidance: string;
  /**
   * CAN THIS BE MEASURED WHILE CAPTURING?
   *
   * This distinction is load-bearing, not decorative. Reprojection error, mesh
   * watertightness and point-cloud density are POST-RECONSTRUCTION quantities —
   * they do not exist until the photographs have been processed, which on a
   * phone happens minutes to hours later and often on another machine. A
   * guidance system that waits for them is not real-time and cannot tell
   * anybody to step closer.
   *
   * Only the metrics flagged `true` here can drive live guidance. The rest are
   * acceptance checks. Conflating the two is how you build a capture app that
   * gives excellent advice about a session that ended yesterday.
   */
  liveMeasurable: boolean;
}

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/** Linear normalisation between a floor and a ceiling. */
const linear =
  (floor: number, ceil: number) =>
  (raw: number): number =>
    clamp01((raw - floor) / (ceil - floor));

/** Logarithmic normalisation, for quantities that span orders of magnitude. */
const logScale =
  (floor: number, ceil: number) =>
  (raw: number): number => {
    if (raw <= 0) return 0;
    return clamp01(
      (Math.log(raw) - Math.log(floor)) / (Math.log(ceil) - Math.log(floor)),
    );
  };

/** Lower-is-better, logarithmic. */
const logScaleInverse =
  (worst: number, best: number) =>
  (raw: number): number => {
    if (raw <= 0) return 1;
    return clamp01(
      (Math.log(worst) - Math.log(raw)) / (Math.log(worst) - Math.log(best)),
    );
  };

const pct = (raw: number): string => `${Math.round(raw * 100)}%`;

export const METRIC_SPECS: MetricSpec[] = [
  {
    id: "angular-coverage",
    label: "Angular coverage",
    unit: "fraction of viewing sphere",
    why: "Surfaces you never pointed the camera at are reconstructed by guesswork or not at all. For a funerary vessel the underside and interior lip are exactly where potters' marks, repair seams and excavation damage sit — the features that distinguish this object from another of the same type.",
    thresholds: { reference: 0.9, study: 0.75, indicative: 0.5 },
    normalise: linear(0, 1),
    format: pct,
    guidance:
      "Keep orbiting. Then raise the camera and orbit again from above, and once from below — one circle at eye level leaves the top and underside unrecorded.",
    liveMeasurable: true,
  },
  {
    id: "surface-completeness",
    label: "Surface completeness",
    unit: "fraction of surface observed",
    why: "Distinct from angular coverage: you can orbit an object fully and still never see inside a cavity or behind a handle. Occluded regions become holes in the mesh, and a hole where a maker's mark should be is indistinguishable from an object that never had one.",
    thresholds: { reference: 0.95, study: 0.85, indicative: 0.6 },
    normalise: linear(0, 1),
    format: pct,
    guidance:
      "Some surfaces are still hidden. Reposition the object — or move the camera into the recesses — so that cavities, undersides and areas behind handles are directly visible in at least a few frames.",
    liveMeasurable: true,
  },
  {
    id: "image-overlap",
    label: "Image overlap",
    unit: "mean overlap between adjacent frames",
    why: "Photogrammetry works by matching the same physical point across several photographs. Below roughly 60% overlap the matcher loses the thread and the reconstruction splits into fragments that cannot be aligned. CIPA guidance for close-range heritage work is 60–80%.",
    thresholds: { reference: 0.78, study: 0.6, indicative: 0.4 },
    normalise: linear(0.35, 0.85),
    format: pct,
    guidance:
      "Move more slowly between shots. Each photograph should still contain about three-quarters of what the previous one showed.",
    liveMeasurable: true,
  },
  {
    id: "sharpness",
    label: "Sharpness",
    unit: "variance of Laplacian",
    why: "Motion blur is the single most common reason a phone capture fails, and it is invisible on a small screen at capture time. Blurred frames do not merely add noise — they contribute wrong feature matches, which bends the reconstructed geometry rather than softening it.",
    thresholds: { reference: 0.7, study: 0.5, indicative: 0.3 },
    normalise: logScale(20, 500),
    format: (raw) => `VoL ${Math.round(raw)}`,
    guidance:
      "Frames are coming out soft. Brace your elbows, pause briefly before each shot, and add light rather than letting the phone lengthen its exposure.",
    liveMeasurable: true,
  },
  {
    id: "exposure",
    label: "Exposure",
    unit: "fraction of pixels clipped",
    why: "Clipped highlights and crushed shadows contain no recoverable detail. On glazed or burnished ceramic a blown highlight erases precisely the surface it sits on, and no amount of processing brings it back — the information was never recorded.",
    thresholds: { reference: 0.85, study: 0.65, indicative: 0.4 },
    normalise: (raw) => clamp01(1 - raw / 0.05),
    format: (raw) => `${(raw * 100).toFixed(1)}% clipped`,
    guidance:
      "Highlights or shadows are clipping. Diffuse the light — bounce it off a wall or ceiling rather than pointing it at the object — and avoid direct sun and bare bulbs.",
    liveMeasurable: true,
  },
  {
    id: "ground-sample-distance",
    label: "Ground sample distance",
    unit: "mm per pixel",
    why: "The real resolution of the record: how much of the object one pixel covers. It sets the smallest feature that can ever be recovered. Tool marks, incision and slip decoration on West African terracotta are sub-millimetre; a 2 mm/px capture cannot see them and never will.",
    thresholds: { reference: 0.75, study: 0.5, indicative: 0.25 },
    normalise: logScaleInverse(3.0, 0.1),
    format: (raw) => `${raw.toFixed(2)} mm/px`,
    guidance:
      "Move closer, or use a longer lens. Fill more of the frame with the object — the resolution of the record is set here and cannot be recovered later.",
    liveMeasurable: true,
  },
  {
    id: "scale-reference",
    label: "Scale reference",
    unit: "present / AR-derived / absent",
    why: "Without a calibrated scale in shot, the model has shape but no size, and an object with no size cannot be measured, compared against a written description, or matched to an excavation record. Phone AR tracking gives approximate metric scale; for anything intended as a reference record a physical scale bar remains the standard.",
    thresholds: { reference: 1.0, study: 0.5, indicative: 0.0 },
    normalise: linear(0, 1),
    format: (raw) =>
      raw >= 1 ? "calibrated scale bar" : raw > 0 ? "AR-derived scale" : "none",
    guidance:
      "Place a calibrated scale bar in the scene, visible in several frames. Without it this capture cannot be used to measure the object.",
    liveMeasurable: true,
  },
  {
    id: "colour-reference",
    label: "Colour reference",
    unit: "present / absent",
    why: "Condition assessment depends on colour being comparable across captures years apart. Without a colour target in shot, the record carries whatever cast the room lighting had, and a later capture cannot distinguish genuine deterioration from a different set of light bulbs.",
    thresholds: { reference: 1.0, study: 0.0, indicative: 0.0 },
    normalise: linear(0, 1),
    format: (raw) => (raw >= 1 ? "colour target present" : "none"),
    guidance:
      "Include a colour reference target in a few frames so that colour in this capture can be compared with future ones.",
    liveMeasurable: true,
  },
  {
    id: "lighting-consistency",
    label: "Lighting consistency",
    unit: "consistency across frames",
    why: "If lighting changes while you orbit, shadows move across the surface and the matcher treats a moving shadow edge as a physical feature. This bakes shading into the texture and can emboss shadow edges into the geometry itself.",
    thresholds: { reference: 0.85, study: 0.65, indicative: 0.4 },
    normalise: linear(0, 1),
    format: pct,
    guidance:
      "Light is changing as you move. Use even, diffuse light that does not move with the camera, and keep your own shadow off the object.",
    liveMeasurable: true,
  },
  {
    id: "device-metadata",
    label: "Device metadata",
    unit: "fraction of frames with complete metadata",
    why: "Focal length, sensor size and camera pose let a reconstruction be checked, and later re-run with better software. Frames stripped of metadata — as most images shared through messaging apps are — can still be used, but the result can no longer be independently verified.",
    thresholds: { reference: 0.95, study: 0.8, indicative: 0.5 },
    normalise: linear(0, 1),
    format: pct,
    guidance:
      "Metadata is missing from some frames. Transfer the originals directly rather than through a messaging app, which strips it.",
    liveMeasurable: false,
  },
];

export const METRIC_BY_ID: Record<CaptureMetricId, MetricSpec> =
  METRIC_SPECS.reduce(
    (acc, spec) => {
      acc[spec.id] = spec;
      return acc;
    },
    {} as Record<CaptureMetricId, MetricSpec>,
  );

/** The class a single normalised value permits. */
export function permittedClass(
  spec: MetricSpec,
  normalised: number,
): CaptureQualityClass {
  if (normalised >= spec.thresholds.reference) return "reference";
  if (normalised >= spec.thresholds.study) return "study";
  if (normalised >= spec.thresholds.indicative) return "indicative";
  return "insufficient";
}

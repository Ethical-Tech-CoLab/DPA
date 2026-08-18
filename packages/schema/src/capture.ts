/**
 * Stage 0 — Capture.
 *
 * PROVENANCE: added in response to AABC feedback (see docs/MEETING-BRIEF.md §7).
 *   The first stage in the pipeline that is not derived from Annex A.
 *   See docs/DECISIONS.md#adr-010.
 *
 * ---------------------------------------------------------------------------
 * THE PROBLEM THIS SOLVES.
 *
 * Stages 1–7 all begin after an object has already been recorded by somebody.
 * They assess an object against a documentary record. Where that record does
 * not exist, they can measure the gap and do nothing about it: this is what
 * `Coverage` reports, and why the Bura askos scores 58 with 0 of 9 registers
 * able to name it.
 *
 * The registers are retrospective. INTERPOL SWOA, the FBI NSAF and the
 * Carabinieri TPC archive hold reports of thefts FROM DOCUMENTED COLLECTIONS.
 * An object from a site that was never inventoried cannot appear in them, ever,
 * no matter how much is later learned about it. The 1970 UNESCO Convention has
 * the same shape: it presupposes an inventory that these sites never had.
 *
 * A capture is the only mechanism in the programme that CREATES record rather
 * than querying it. It cannot help an object already looted from an unrecorded
 * site. It can start the record, from today, for everything still in museum,
 * community or private custody — which is the large majority of the material
 * this programme is concerned with.
 *
 * WHAT A CAPTURE ATTESTS.
 *
 *   "An object with these measurable characteristics was observed in this
 *    condition, at this place, at this time, by this party, and this is a
 *    tamper-evident record of that observation."
 *
 * WHAT IT DOES NOT ATTEST. That the object was lawfully excavated, exported,
 * acquired or is lawfully held. A flawless capture of a looted object is a
 * flawless capture of a looted object. Capture quality and provenance
 * legitimacy are orthogonal and the system must never let the first be
 * mistaken for the second — this is ADR-009 ("no register check returns
 * clear") applied to a new surface.
 *
 * ADR-010 STRUCTURAL ENFORCEMENT. `CaptureQuality.qualityScore` is a SEPARATE
 * number from `Passport.riskAssessment.confidenceScore` and MUST NEVER be
 * folded into it, exactly as `Coverage` must not be (ADR-003). The two answer
 * different questions:
 *
 *   confidenceScore — how much is known about where this object came from?
 *   qualityScore    — how good is the record we just made of the object itself?
 *
 * A museum with excellent scanning equipment and no provenance documentation
 * would otherwise be able to raise its objects' provenance confidence by buying
 * a better camera. That must be structurally impossible, not merely discouraged.
 * ---------------------------------------------------------------------------
 */

import { z } from "zod";
import { DisclosureTier } from "./roles.js";

/* -------------------------------------------------------------------------- */
/* Who captured it                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The role under which a capture was performed.
 *
 * This is deliberately NOT `IssuerClass`. ADR-004 defines two issuer classes —
 * `pseudonymous-wallet` (the holder) and `accredited-institution` — and both
 * make assertions about ownership. Crowd-sourced capture introduces an actor
 * neither class describes: someone who records an object they do not own and
 * cannot make ownership claims about.
 *
 * Keeping these enums separate is what stops a capture from being mistaken for
 * an ownership assertion. A volunteer photographing a museum vitrine produces
 * a record of an observation; they have asserted nothing about title.
 */
export const CaptureOperatorRole = z.enum([
  /** The institution that holds the object, capturing its own holdings. */
  "custodian-institution",
  /** A source community recording material it claims cultural authority over. */
  "community-steward",
  /** A professional surveyor engaged for the purpose. */
  "accredited-surveyor",
  /** Crowd-sourced. Unverified relationship to the object. */
  "contributor",
]);
export type CaptureOperatorRole = z.infer<typeof CaptureOperatorRole>;

/**
 * How much the operator's claimed relationship to the object was checked.
 *
 * Separate from the role, because a claimed role is not a verified one, and the
 * whole point of crowd-sourced ingestion is that most contributions arrive with
 * `self-asserted` and must still be worth accepting.
 */
export const OperatorVerification = z.enum([
  "self-asserted",
  "email-domain-verified",
  "institution-attested",
  "on-site-witnessed",
]);
export type OperatorVerification = z.infer<typeof OperatorVerification>;

/* -------------------------------------------------------------------------- */
/* How it was captured                                                         */
/* -------------------------------------------------------------------------- */

export const CaptureMethod = z.enum([
  "photogrammetry-mobile",
  "photogrammetry-dslr",
  "structured-light",
  "lidar",
  "laser-scan",
]);
export type CaptureMethod = z.infer<typeof CaptureMethod>;

/* -------------------------------------------------------------------------- */
/* Quality                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * What a capture is FIT FOR. Deliberately expressed as fitness for a purpose
 * rather than as a grade, because "7.2/10" tells a museum nothing about whether
 * it may rely on the result.
 */
export const CaptureQualityClass = z.enum([
  /** Fit to serve as the identifying record of the object. */
  "reference",
  /** Fit for scholarly comparison and condition assessment, not identification. */
  "study",
  /** Fit to display. Not fit to measure, compare or identify against. */
  "indicative",
  /** Not fit to accept. */
  "insufficient",
]);
export type CaptureQualityClass = z.infer<typeof CaptureQualityClass>;

export const CaptureMetricId = z.enum([
  "angular-coverage",
  "surface-completeness",
  "image-overlap",
  "sharpness",
  "exposure",
  "ground-sample-distance",
  "scale-reference",
  "colour-reference",
  "lighting-consistency",
  "device-metadata",
]);
export type CaptureMetricId = z.infer<typeof CaptureMetricId>;

export const CaptureMetric = z.object({
  id: CaptureMetricId,
  label: z.string(),
  /** Normalised 0–1 so metrics in different units remain comparable. */
  value: z.number().min(0).max(1),
  /** The raw measurement, for a human who wants to check the normalisation. */
  measured: z.string(),
  /** The best class this metric alone would permit. */
  permits: CaptureQualityClass,
  /**
   * Why this metric matters for a cultural object specifically — shown to the
   * contributor. A rubric a museum cannot read is not a rubric.
   */
  why: z.string(),
});
export type CaptureMetric = z.infer<typeof CaptureMetric>;

/**
 * MANDATORY on every capture record.
 *
 * NOTE THE SCORING MODEL. `qualityClass` is set by the WORST metric, not the
 * average. This is not conservatism, it is geometry: four hundred photographs
 * that are all out of focus produce an out-of-focus mesh, and averaging a
 * perfect image count against poor sharpness would report that scan as
 * acceptable. Quality is bounded by its weakest dimension.
 *
 * This is the opposite of the provenance scorer (ADR-002), which accumulates,
 * because evidence genuinely does add up and surface detail genuinely does not.
 */
export const CaptureQuality = z.object({
  qualityClass: CaptureQualityClass,
  /** A meter, NOT a probability, and NOT provenance confidence. ADR-010. */
  qualityScore: z.number().min(0).max(100),
  metrics: z.array(CaptureMetric),
  /**
   * The metric currently holding the class down — i.e. the single thing worth
   * fixing. Null only when the capture is already `reference`.
   */
  limitingMetric: CaptureMetricId.nullable(),
  /** What this capture may and may not be used for, in plain words. */
  note: z.string(),
  /** Scores are comparable only within a capture method. */
  comparability: z.string(),
});
export type CaptureQuality = z.infer<typeof CaptureQuality>;

/* -------------------------------------------------------------------------- */
/* Assets                                                                      */
/* -------------------------------------------------------------------------- */

export const CaptureAssetKind = z.enum([
  "mesh",
  "texture",
  "point-cloud",
  "image-set",
  "depth-map",
]);
export type CaptureAssetKind = z.infer<typeof CaptureAssetKind>;

/**
 * ADR-005 EXTENSION. A mesh is not a metadata field and the envelope was not
 * designed for it. A capture asset carries two risks no text field carries:
 *
 *  1. It is a REPLICATION asset. A scan good enough to study is good enough to
 *     forge from or 3D-print.
 *  2. For funerary or sacred material, public visibility may itself be the
 *     harm. The Bura askos is a grave good. Publishing a rotatable model of
 *     grave goods is a source-community consent question, not a checkbox.
 *
 * So the tier is per-asset and its default is NOT public.
 */
export const CaptureAsset = z.object({
  kind: CaptureAssetKind,
  sha256: z.string(),
  byteLength: z.number().int().nonnegative(),
  mimeType: z.string(),
  /** Defaults to `museum` for meshes. Raising it to `public` is a decision. */
  disclosureTier: DisclosureTier,
  /** Why this tier — recorded so the choice can be audited later. */
  tierRationale: z.string(),
});
export type CaptureAsset = z.infer<typeof CaptureAsset>;

/* -------------------------------------------------------------------------- */
/* The reconstruction gap                                                      */
/* -------------------------------------------------------------------------- */

/**
 * WHERE THE PROVENANCE CHAIN BREAKS TODAY — and the one place this programme
 * has something genuinely new to contribute.
 *
 * C2PA (Adobe, BBC, Google, Microsoft, Sony, Truepic et al.) solves capture-time
 * provenance for 2D media well: a hard binding hashes the asset bytes, an X.509
 * signature covers the claim, and an RFC 3161 timestamp proves when. Truepic
 * signs inside the secure enclave before the image leaves the sensor.
 *
 * None of that survives photogrammetry. As of C2PA spec v2.1–v2.4 the normative
 * format list is JPEG, PNG, GIF, TIFF, BMFF video and PDF. glTF/GLB, USDZ, E57
 * and PLY are absent. So the individual photographs in a capture session can be
 * sealed to a very high standard, and **the mesh reconstructed from them
 * inherits none of it**. The chain breaks precisely at the step that produces
 * the artefact anyone will actually look at.
 *
 * Every crowd-sourced heritage capture effort we surveyed — Rekrei/Project
 * Mosul, Backup Ukraine, the Million Image Database — used general-purpose
 * photogrammetry apps and sealed the 3D output not at all. Rekrei accepts any
 * photograph with no submission quality protocol whatsoever.
 *
 * This record is the missing link. It binds, in one signed structure:
 *   - the set of source images (by a hash over their sorted per-image hashes),
 *   - how many of those carried a verifiable capture-time seal,
 *   - the reconstruction software and parameters that produced the mesh,
 *   - the hash of the resulting mesh,
 *   - and a PERCEPTUAL hash of the mesh as a soft binding, so a re-exported or
 *     metadata-stripped copy can still be re-associated with this record.
 *
 * It does not make the reconstruction reproducible — photogrammetry pipelines
 * are not bit-deterministic — and `chainComplete` says so honestly rather than
 * implying a guarantee the format cannot make.
 */
export const ReconstructionBinding = z.object({
  sourceImageCount: z.number().int().nonnegative(),
  /** Hash over the sorted per-image SHA-256 list. Fixes the input set. */
  sourceImageSetHash: z.string(),
  /**
   * How many source images carried a verifiable capture-time seal (C2PA or
   * equivalent). Reported as a fraction of the whole, never rounded up to
   * "sealed". A partially sealed set is a partially sealed set.
   */
  sealedImageCount: z.number().int().nonnegative(),
  /** Software and version that performed the reconstruction. */
  pipeline: z.string(),
  /** Parameters, so another operator can attempt to approximate the result. */
  parameters: z.string(),
  /** SHA-256 of the output mesh bytes. Hard binding. */
  outputHash: z.string(),
  /**
   * Soft binding. Survives re-export, recompression and metadata stripping,
   * which the hard binding does not. Uses the same dHash family as
   * `@dpa/identity`, applied to rendered orthographic views of the mesh.
   */
  outputPerceptualHash: z.string(),
  /**
   * True only when every source image was sealed AND the pipeline is recorded.
   * Anything less is false with an explanation, because a chain that is 90%
   * complete is a broken chain.
   */
  chainComplete: z.boolean(),
  chainNote: z.string(),
});
export type ReconstructionBinding = z.infer<typeof ReconstructionBinding>;

/* -------------------------------------------------------------------------- */
/* The record                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The beginning of a provenance trail.
 *
 * `attests` and `doesNotAttest` are MANDATORY STRING FIELDS rather than
 * documentation. A capture record cannot be serialised without stating what it
 * does not prove. That makes ADR-009's discipline structural instead of a UI
 * convention someone can forget to implement.
 */
export const CaptureRecord = z.object({
  captureId: z.string(),
  method: CaptureMethod,

  operatorRole: CaptureOperatorRole,
  operatorVerification: OperatorVerification,
  /** Pseudonymous by default, as everywhere else in the system. */
  operatorPseudonym: z.string(),

  /** Where the object physically was at capture time, and who held it. */
  observedAt: z.string(),
  observedLocation: z.string(),
  custodyStatement: z.string(),

  device: z.string(),
  assets: z.array(CaptureAsset),
  reconstruction: ReconstructionBinding.nullable(),
  quality: CaptureQuality,

  /** Literal. What a reader is entitled to conclude from this record. */
  attests: z.string(),
  /** Literal. What they are NOT entitled to conclude. Never empty. */
  doesNotAttest: z.string(),

  contentHash: z.string(),
  signature: z.string(),
});
export type CaptureRecord = z.infer<typeof CaptureRecord>;

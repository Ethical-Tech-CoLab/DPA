/**
 * Build a capture record — the beginning of a provenance trail.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS MODULE IS CAREFUL ABOUT.
 *
 * A capture record is the first thing in this system that can be mistaken for
 * something it is not. It has a signature, a hash, a timestamp and a chain of
 * custody; it looks exactly like proof of legitimate ownership, and it is not.
 * A flawless capture of a looted object is a flawless capture of a looted
 * object.
 *
 * Three mechanisms keep that distinction:
 *
 *  1. `doesNotAttest` is a MANDATORY field and this module refuses to emit one
 *     that omits the legitimacy disclaimer. Not a lint rule, not a UI
 *     convention — a record without it cannot be built. `record.test.ts` locks
 *     that in.
 *
 *  2. Capture operators are a SEPARATE enum from issuer classes. A contributor
 *     who scans a vitrine has asserted nothing about title, and there is no
 *     type by which their capture could be read as an ownership claim.
 *
 *  3. Asset disclosure tiers default CLOSED and the default is stricter for
 *     funerary and sacred material. Publishing a rotatable model of grave goods
 *     is a decision someone has to take deliberately.
 *
 * This module reuses `contentHash` from `@dpa/schema` rather than growing its
 * own. During the v0.4 consolidation two packages independently implemented
 * that function, disagreed on digest, prefix and excluded fields, and produced
 * passports that could be signed by one and verified by neither. One
 * canonicalisation, defined once.
 * ---------------------------------------------------------------------------
 */

import type {
  CaptureAsset,
  CaptureAssetKind,
  CaptureMethod,
  CaptureOperatorRole,
  CaptureQuality,
  CaptureRecord,
  DisclosureTier,
  OperatorVerification,
  ReconstructionBinding,
} from "@dpa/schema";
import { contentHash } from "@dpa/schema";

/**
 * The sentence every capture record must carry. Kept as a constant so a test
 * can assert its presence rather than trusting each call site.
 */
export const LEGITIMACY_DISCLAIMER =
  "This record does not attest that the object was lawfully excavated, exported, acquired, or is lawfully held. It records an observation of an object, not a right to it. Capture quality and provenance legitimacy are unrelated: a high-quality capture of an unlawfully held object is a high-quality capture of an unlawfully held object.";

/**
 * How sensitive the material is, which sets how closed the assets start.
 *
 * `funerary` is not a hypothetical category here. The Bura askos — the case
 * this whole protocol is aimed at — is a grave good, and the communities of the
 * Tillabéri region regard the burial sites as ancestral ground. A 3D model of
 * it is not obviously something to publish, and the system should not make
 * publishing it the path of least resistance.
 */
export type MaterialSensitivity = "ordinary" | "funerary" | "sacred";

export interface BuildCaptureInput {
  captureId: string;
  method: CaptureMethod;
  operatorRole: CaptureOperatorRole;
  operatorVerification: OperatorVerification;
  operatorPseudonym: string;
  observedAt: string;
  observedLocation: string;
  custodyStatement: string;
  device: string;
  assets: Array<{
    kind: CaptureAssetKind;
    sha256: string;
    byteLength: number;
    mimeType: string;
    /** Override the default. Raising it above the default is a decision. */
    disclosureTier?: DisclosureTier;
  }>;
  reconstruction: ReconstructionBinding | null;
  quality: CaptureQuality;
  sensitivity: MaterialSensitivity;
  /** Set by the signer; this module does not hold keys. */
  signature: string;
}

/**
 * Default disclosure tier for a capture asset.
 *
 * ADR-005 EXTENSION. Meshes and point clouds are replication assets: a model
 * good enough to study is good enough to 3D-print or to forge from. Image sets
 * are worse, because they are the raw material for making a better model still.
 * None of these default to public.
 *
 * For funerary and sacred material the default is `source-community`, meaning
 * nothing is published until the community with cultural authority has been
 * asked. That may be the wrong default — but it is wrong in the direction that
 * can be corrected, whereas publishing first cannot be undone.
 */
export function defaultTier(
  kind: CaptureAssetKind,
  sensitivity: MaterialSensitivity,
): DisclosureTier {
  if (sensitivity === "sacred" || sensitivity === "funerary") {
    return "source-community";
  }
  switch (kind) {
    case "mesh":
    case "point-cloud":
      return "museum";
    case "image-set":
    case "depth-map":
      return "museum";
    case "texture":
      return "museum";
  }
}

function tierRationale(
  kind: CaptureAssetKind,
  sensitivity: MaterialSensitivity,
  tier: DisclosureTier,
): string {
  if (sensitivity === "funerary" || sensitivity === "sacred") {
    return `${sensitivity === "funerary" ? "Funerary" : "Sacred"} material. Held at source-community tier until the community with cultural authority over this object has been consulted. Publication is a consent question, not a configuration setting.`;
  }
  if (tier === "public") {
    return `Released publicly by explicit decision, overriding the default for ${kind} assets.`;
  }
  return `Default for ${kind} assets. A capture detailed enough to study is detailed enough to reproduce or to forge from, so it is not public by default.`;
}

/** What this record entitles a reader to conclude. */
export function buildAttestation(input: {
  operatorRole: CaptureOperatorRole;
  operatorVerification: OperatorVerification;
  observedAt: string;
  observedLocation: string;
  quality: CaptureQuality;
  reconstruction: ReconstructionBinding | null;
}): string {
  const verified =
    input.operatorVerification === "self-asserted"
      ? "whose stated relationship to the object has not been verified"
      : `whose relationship to the object was checked by ${input.operatorVerification.replace(/-/g, " ")}`;

  const chain =
    input.reconstruction === null
      ? "No reconstruction binding is recorded, so the assets cannot be traced back to a specific set of source photographs."
      : input.reconstruction.chainComplete
        ? "The resulting assets are bound to the exact set of source photographs they were reconstructed from, and every one of those photographs carried a verifiable capture-time seal."
        : `The resulting assets are bound to the set of source photographs they were reconstructed from, but the seal is incomplete: ${input.reconstruction.sealedImageCount} of ${input.reconstruction.sourceImageCount} source images carried a verifiable capture-time seal.`;

  return `An object was observed at ${input.observedLocation} on ${input.observedAt} by an operator acting as ${input.operatorRole.replace(/-/g, " ")}, ${verified}. The record of that observation is rated ${input.quality.qualityClass}: ${input.quality.note} ${chain}`;
}

/** What this record does NOT entitle a reader to conclude. Never empty. */
export function buildNonAttestation(input: {
  operatorVerification: OperatorVerification;
  quality: CaptureQuality;
  reconstruction: ReconstructionBinding | null;
}): string {
  const parts: string[] = [LEGITIMACY_DISCLAIMER];

  if (input.operatorVerification === "self-asserted") {
    parts.push(
      "The operator's identity and their stated relationship to the object are self-asserted and unverified.",
    );
  }
  if (input.quality.qualityClass !== "reference") {
    parts.push(
      `This capture is rated ${input.quality.qualityClass} and is not sufficient to serve as the identifying record of the object: it cannot reliably distinguish this object from a similar one, nor detect substitution.`,
    );
  }
  if (input.reconstruction === null || !input.reconstruction.chainComplete) {
    parts.push(
      "The chain from source photographs to the delivered 3D asset is not fully sealed, so the assets cannot be independently proven to derive from this observation alone.",
    );
  }
  return parts.join(" ");
}

export function buildCaptureRecord(input: BuildCaptureInput): CaptureRecord {
  const assets: CaptureAsset[] = input.assets.map((a) => {
    const tier = a.disclosureTier ?? defaultTier(a.kind, input.sensitivity);
    return {
      kind: a.kind,
      sha256: a.sha256,
      byteLength: a.byteLength,
      mimeType: a.mimeType,
      disclosureTier: tier,
      tierRationale: tierRationale(a.kind, input.sensitivity, tier),
    };
  });

  const attests = buildAttestation({
    operatorRole: input.operatorRole,
    operatorVerification: input.operatorVerification,
    observedAt: input.observedAt,
    observedLocation: input.observedLocation,
    quality: input.quality,
    reconstruction: input.reconstruction,
  });

  const doesNotAttest = buildNonAttestation({
    operatorVerification: input.operatorVerification,
    quality: input.quality,
    reconstruction: input.reconstruction,
  });

  /* A capture record whose disclaimer has been emptied is not a lesser record,
   * it is a misleading one. Fail loudly rather than emit it. */
  if (!doesNotAttest.includes(LEGITIMACY_DISCLAIMER)) {
    throw new Error(
      "capture record must carry the legitimacy disclaimer in doesNotAttest",
    );
  }

  const unsealed: Omit<CaptureRecord, "contentHash"> = {
    captureId: input.captureId,
    method: input.method,
    operatorRole: input.operatorRole,
    operatorVerification: input.operatorVerification,
    operatorPseudonym: input.operatorPseudonym,
    observedAt: input.observedAt,
    observedLocation: input.observedLocation,
    custodyStatement: input.custodyStatement,
    device: input.device,
    assets,
    reconstruction: input.reconstruction,
    quality: input.quality,
    attests,
    doesNotAttest,
    signature: input.signature,
  };

  return {
    ...unsealed,
    contentHash: contentHash(unsealed as unknown as Record<string, unknown>),
  };
}

/**
 * Decide whether a reconstruction chain is complete.
 *
 * Deliberately strict. A chain is complete only when EVERY source image
 * carried a verifiable capture-time seal and the pipeline is recorded. A chain
 * that is 90% sealed is not 90% of a proof — the unsealed 10% is exactly where
 * a substituted photograph would be inserted, and an attacker chooses where to
 * attack.
 */
export function evaluateChain(input: {
  sourceImageCount: number;
  sealedImageCount: number;
  pipeline: string;
}): { chainComplete: boolean; chainNote: string } {
  if (input.sourceImageCount === 0) {
    return {
      chainComplete: false,
      chainNote: "No source images were recorded, so nothing binds the delivered asset to an observation.",
    };
  }
  if (input.pipeline.trim() === "") {
    return {
      chainComplete: false,
      chainNote: "The reconstruction pipeline was not recorded, so the step from photographs to mesh cannot be described or approximated by anyone else.",
    };
  }
  if (input.sealedImageCount < input.sourceImageCount) {
    const gap = input.sourceImageCount - input.sealedImageCount;
    return {
      chainComplete: false,
      chainNote: `${gap} of ${input.sourceImageCount} source images carried no verifiable capture-time seal. An unsealed image is where a substituted photograph would be inserted, so a partly sealed set is treated as unsealed rather than as mostly sealed.`,
    };
  }
  return {
    chainComplete: true,
    chainNote: `All ${input.sourceImageCount} source images carried a verifiable capture-time seal, and the reconstruction pipeline is recorded. Note that photogrammetric reconstruction is not bit-deterministic: this binds the inputs and the output, and does not make the reconstruction reproducible.`,
  };
}

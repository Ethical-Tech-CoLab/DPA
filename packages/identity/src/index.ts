/**
 * @dpa/identity — image fingerprinting, similarity, forensics, identification.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/digital-passport-artworks and
 *   Ethical-Tech-CoLab/provenance-search. See docs/DECISIONS.md#adr-008.
 */
export type { RasterImage } from "./fingerprint.js";
export {
  toGrayscale,
  sha256Hex,
  dHash,
  angleCount,
} from "./fingerprint.js";

export type { SimilarityVerdict } from "./similarity.js";
export {
  hammingDistance,
  dHashSimilarity,
  compare,
} from "./similarity.js";

export type { ForensicsResult } from "./forensics.js";
export {
  computeForensics,
  detectProvenanceMarkers,
} from "./forensics.js";

export type {
  IdentifyCandidate,
  IdentifyOptions,
  IdentifyInput,
  IdentifyResult,
  CatalogueEntry,
  BuildObjectIdentityInput,
} from "./identify.js";
export {
  identifyObject,
  buildObjectIdentity,
  GeminiKeyMissingError,
} from "./identify.js";

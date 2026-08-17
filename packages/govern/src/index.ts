/**
 * @dpa/govern — the confidentiality envelope package.
 *
 * This is the framework's core contribution: role-based redaction of Digital
 * Passports with a provably clean boundary. Nothing else in the project
 * guarantees the same property — this is the reason the whole programme works.
 *
 * PROVENANCE: ported from yorkerhodes3/dpa-prototype.
 * See docs/DECISIONS.md#adr-005, adr-006.
 */

export { redactForRole, resolveTier } from "./redact.js";
export { assertNoLeakage, LeakageError } from "./verifyBoundary.js";
export {
  buildEnvelope,
  validateEnvelope,
  explainDisclosure,
  ENVELOPE_VERSION,
} from "./envelope.js";
export {
  notarisePassport,
  verifyNotarisation,
  computeContentHash,
  easScanUrl,
  LiveModeError,
  HashMismatchError,
  BASE_SEPOLIA_RPC,
  BASE_SEPOLIA_CHAIN_ID,
  EAS_CONTRACT,
  SCHEMA_REGISTRY,
  EAS_EXPLORER,
  DPA_SCHEMA_STRING,
} from "./notarise.js";
export type { NotariseResult, VerifyResult } from "./notarise.js";
export type { ValidationResult } from "./envelope.js";

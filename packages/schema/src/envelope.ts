/**
 * The default field→tier map: the concrete disclosure policy of v0.4.
 *
 * PROVENANCE: yorkerhodes3/dpa-prototype (schemas/confidentiality-envelope.json).
 *
 * Keys are dot paths into the passport. A path covers itself and everything
 * beneath it, so `artwork` sets a default for all of `artwork.*` and a more
 * specific path such as `artwork.dimensions` overrides it.
 *
 * The bias is deliberate: metadata that helps the object be FOUND and STUDIED
 * is public; metadata that helps the holder be IDENTIFIED or the object be
 * STOLEN is not. That asymmetry is the participation bargain — a holder
 * registers only if surfacing the object does not surface them.
 */
import type { DisclosureTier } from "./roles.js";

export const ENVELOPE_VERSION = "0.4.0";

export const DEFAULT_FIELD_TIERS: Record<string, DisclosureTier> = {
  /* ---- identity of the record itself: always public ---- */
  "@context": "public",
  type: "public",
  schemaVersion: "public",
  id: "public",
  issuedAt: "public",
  contentHash: "public",
  signature: "public",
  "issuer.name": "public",
  "issuer.issuerClass": "public",
  "issuer.id": "public",
  "issuer.wallet": "public",
  "issuer.certificateChain": "public",
  disclosure: "public",
  credentialStatus: "public",
  notarisation: "public",

  /* ---- the object, as scholarship needs it ---- */
  artwork: "public",
  "artwork.title": "public",
  "artwork.artist": "public",
  "artwork.period": "public",
  "artwork.culture": "public",
  "artwork.material": "public",
  "artwork.imageHash": "public",
  "artwork.imageUrl": "public",
  // Physical specifics assist both loan assessment and theft. Museum tier.
  "artwork.dimensions": "museum",
  // Where the object physically is. Enforcement tier: publishing the location of
  // a contested object endangers both the object and the holder.
  "artwork.currentLocation": "enforcement",

  /* ---- assessment: public, because a score with no audience changes nothing ---- */
  riskAssessment: "public",
  "riskAssessment.confidenceScore": "public",
  "riskAssessment.coverage": "public",
  "riskAssessment.scorer": "public",
  // Individual flags can quote register hits and narrative detail.
  "riskAssessment.flags": "museum",

  /* ---- object identity / forensics ---- */
  objectIdentity: "museum",
  "objectIdentity.sha256": "public",
  "objectIdentity.dHash": "public",
  "objectIdentity.forgeryRisk": "museum",
  "objectIdentity.duplicateOf": "enforcement",
  "objectIdentity.similarityScore": "enforcement",

  /* ---- community-facing (ORTHOGONAL tier) ---- */
  // A community must be able to see that a claim exists on its own material,
  // and the terms under which the object is held.
  claimStatus: "source-community",
  custodianship: "source-community",
  sourceCommunityStatement: "source-community",

  /* ---- institution-facing ---- */
  condition: "museum",
  loanEligibility: "museum",

  /* ---- the provenance narrative itself ---- */
  // The full timeline can name living people, dealers and intermediaries.
  provenanceTimeline: "enforcement",
  // Which registers were consulted, how, and with what caveat is a methodological
  // disclosure and is public. The HITS are not.
  registryChecks: "enforcement",
  premiumChecks: "enforcement",

  /* ---- the holder ---- */
  holderPseudonym: "enforcement",
  contactEscrow: "enforcement",
  holderIdentity: "owner",
};

/**
 * Fields whose mere presence is public even when their contents are not.
 * Rendering "12 provenance events recorded — not visible at your access level"
 * is materially different from rendering nothing: it tells a public reader that
 * the record exists and is substantive, which is the point of the programme.
 */
export const COUNT_ONLY_PUBLIC: string[] = [
  "provenanceTimeline",
  "registryChecks",
  "riskAssessment.flags",
];

export function defaultEnvelope() {
  return {
    envelopeVersion: ENVELOPE_VERSION,
    defaultTier: "owner" as DisclosureTier,
    fieldTiers: { ...DEFAULT_FIELD_TIERS },
  };
}

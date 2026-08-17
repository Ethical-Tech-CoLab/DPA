/**
 * Test helpers — minimal valid Passport body for signing tests.
 */

import type { Passport } from "@dpa/schema";
import { contentHash } from "./canonicalise.js";
import type { WalletIssuer } from "./wallet.js";
import { signAsWallet } from "./wallet.js";
import type { CAChain } from "./institution.js";
import { caChainToIssuer, signAsInstitution } from "./institution.js";

export const MINIMAL_ARTWORK = {
  title: "Test Artwork",
  artist: null,
  period: null,
  culture: null,
  material: null,
  dimensions: null,
  currentLocation: null,
  imageHash: null,
  imageUrl: null,
};

export const MINIMAL_OBJECT_IDENTITY = {
  sha256: "abc123",
  dHash: "0000000000000000",
  angleCount: null,
  embeddingRef: null,
  duplicateOf: null,
  similarityScore: null,
  forgeryRisk: null,
};

export const MINIMAL_RISK_ASSESSMENT = {
  confidenceScore: 45,
  coverage: {
    acquisitionMode: "market" as const,
    region: null,
    coverageClass: "partially-covered" as const,
    coverageRatio: 0.5,
    identifyingRegisters: [],
    weakRegisters: [],
    blindRegisters: [],
    note: "test",
    comparability: "test",
  },
  flags: [],
  scorer: "accumulation-v0.4" as const,
};

export const MINIMAL_CREDENTIAL_STATUS = {
  type: "StatusList2021Entry" as const,
  statusPurpose: "revocation" as const,
  statusListIndex: 0,
  statusListCredential: "https://example.com/status/list-1",
};

export const MINIMAL_DISCLOSURE = {
  envelopeVersion: "0.4.0",
  defaultTier: "owner" as const,
  fieldTiers: {},
};

/**
 * Build a minimal passport body ready to be signed.
 * Does not include `signature`.
 */
export function buildPassportBody(
  issuer: Passport["issuer"],
): Omit<Passport, "signature"> {
  const body = {
    "@context": { "@vocab": "https://schema.org/" },
    type: "DigitalProvenancePassport" as const,
    schemaVersion: "0.4.0",
    id: `dpa-test-${Date.now()}`,
    artwork: MINIMAL_ARTWORK,
    objectIdentity: MINIMAL_OBJECT_IDENTITY,
    provenanceTimeline: [],
    registryChecks: [],
    premiumChecks: [],
    riskAssessment: MINIMAL_RISK_ASSESSMENT,
    claimStatus: "none" as const,
    custodianship: null,
    sourceCommunityStatement: null,
    condition: null,
    loanEligibility: null,
    holderPseudonym: null,
    contactEscrow: null,
    holderIdentity: null,
    issuer,
    disclosure: MINIMAL_DISCLOSURE,
    credentialStatus: MINIMAL_CREDENTIAL_STATUS,
    notarisation: null,
    issuedAt: new Date().toISOString(),
    contentHash: "", // filled below
  };
  // Compute and attach the contentHash before signing.
  (body as Record<string, unknown>).contentHash = contentHash(body as Record<string, unknown>);
  return body as Omit<Passport, "signature">;
}

/** Build + sign a wallet passport. */
export function makeWalletPassport(wi: WalletIssuer): Passport {
  const body = buildPassportBody(wi.issuer);
  const signature = signAsWallet(body, wi.privateKey);
  return { ...body, signature } as Passport;
}

/** Build + sign an institution passport. */
export function makeInstitutionPassport(ca: CAChain): Passport {
  const issuer = caChainToIssuer(ca, "Test Institution");
  const body = buildPassportBody(issuer);
  const signature = signAsInstitution(body, ca);
  return { ...body, signature } as Passport;
}

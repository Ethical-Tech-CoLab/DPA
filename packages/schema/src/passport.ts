/**
 * The canonical Digital Passport envelope — v0.4.
 *
 * PROVENANCE: derived from Ethical-Tech-CoLab/arts-provenance-agent
 *   (schema/passport.ts), which v0.4 adopts as the canonical shape per
 *   docs/DECISIONS.md#adr-001. Extended here with coverage (ADR-003),
 *   disclosure (ADR-005), issuer classes (ADR-004), object identity /
 *   forensics, revocation, and on-chain notarisation (ADR-006).
 *
 * The signature covers a canonical hash of everything EXCEPT `signature`.
 *
 * ---------------------------------------------------------------------------
 * THREE NUMBERS, NEVER COMBINED.
 *
 *   confidenceScore  — how much sourced provenance evidence exists (0–100)
 *   coverageClass    — whether that evidence COULD have existed
 *   forgeryRisk      — whether the image is what it claims to be (0–100)
 *
 * Folding coverage into the confidence score would produce one number meaning
 * two things, which is the defect the coverage model exists to fix. Merging
 * forgery risk with provenance confidence conflates "is this a fake?" with
 * "was this looted?" — unrelated questions with the same scale.
 * ---------------------------------------------------------------------------
 */
import { z } from "zod";
import { DisclosureTier } from "./roles.js";

export const PASSPORT_CONTEXT = {
  "@vocab": "https://schema.org/",
  prov: "http://www.w3.org/ns/prov#",
  passport: "https://ethical-tech-colab.github.io/DPA/ns#",
} as const;

export const PASSPORT_SCHEMA_VERSION = "0.4.0";

/* -------------------------------------------------------------------------- */
/* Evidence                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * How strongly a claim is backed — the anti-hallucination spine.
 *
 * NOTE the precise claim this supports: it makes UNSOURCED history structurally
 * impossible. It does not make FALSE history impossible — a false claim wearing
 * a real source URL is not prevented by this mechanism. See BACKLOG.md P0-4.
 */
export const VerificationTier = z.enum([
  "verifiedByAuthority", // museum / government / register record
  "reportedInPress", // news outlet
  "inferred", // model inference from cited context (lowest trust)
]);
export type VerificationTier = z.infer<typeof VerificationTier>;

export const TimelineEvent = z.object({
  event: z.string(),
  date: z.string().nullable(),
  location: z.string().nullable(),
  /** REQUIRED. No source, no claim. */
  source: z.string(),
  sourceType: z.string(),
  verifiedBy: z.string(),
  tier: VerificationTier,
  confidence: z.number().min(0).max(1),
  /**
   * Set when the assertion came from model general knowledge rather than a
   * retrieved document. Such a claim may never be presented as verified, and
   * carries an automatic medium-severity flag.
   * PROVENANCE: generalised from Ethical-Tech-CoLab/provenance-search. ADR-008.
   */
  isGeneralKnowledge: z.boolean().default(false),
});
export type TimelineEvent = z.infer<typeof TimelineEvent>;

/* -------------------------------------------------------------------------- */
/* Risk                                                                        */
/* -------------------------------------------------------------------------- */

export const RiskFlagType = z.enum([
  "lootingSignal",
  "alrPotentialMatch",
  "repatriationPrecedent",
  "valuationAnomaly",
  "provenanceGap",
  "registrySignal", // a register names this object (a lead, never a finding)
  "registryCoverageGap", // registers that could not be searched — recorded, never scored
  "cryptoTransactionFlag", // the x402 settlement tx (audit only; AML not implemented)
  "unsourcedAssertion", // general-knowledge answer used in place of a document
  "duplicateSuspected", // matches an already-registered object
]);
export type RiskFlagType = z.infer<typeof RiskFlagType>;

export const RiskFlag = z.object({
  type: RiskFlagType,
  severity: z.enum(["low", "medium", "high"]),
  evidence: z.string(),
  source: z.string(),
});
export type RiskFlag = z.infer<typeof RiskFlag>;

/* -------------------------------------------------------------------------- */
/* Registers                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * One register check, recorded in the signed credential.
 *
 * `access`, `verdict`, `method` and `caveat` are carried TOGETHER and signed,
 * so a downstream consumer cannot strip a verdict from the caveat qualifying
 * it. There is deliberately no `clear` verdict — see ADR-009.
 *
 * PROVENANCE: Ethical-Tech-CoLab/arts-provenance-agent.
 */
export const RegistryCheckRecord = z.object({
  registry: z.string(),
  assertedBy: z.string(),
  access: z.enum(["structured-api", "grounded-search", "referral-only", "paid-x402"]),
  /** No `clear`. The strongest available negative is `no-evidence-found`. */
  verdict: z.enum(["possible-match", "no-evidence-found", "not-queryable", "not-run"]),
  method: z.string(),
  caveat: z.string(),
  hits: z.array(
    z.object({
      claim: z.string(),
      source: z.string(),
      riskRelevant: z.boolean(),
    }),
  ),
  officialSearch: z.string(),
  checkedAt: z.string(),
});
export type RegistryCheckRecord = z.infer<typeof RegistryCheckRecord>;

/* -------------------------------------------------------------------------- */
/* Coverage — ADR-003                                                          */
/* -------------------------------------------------------------------------- */

export const AcquisitionMode = z.enum([
  "archaeological",
  "colonial",
  "nazi-era",
  "market-theft",
  "market",
  "unknown",
]);
export type AcquisitionMode = z.infer<typeof AcquisitionMode>;

export const CoverageClass = z.enum([
  "well-covered",
  "partially-covered",
  "structurally-uncovered",
]);
export type CoverageClass = z.infer<typeof CoverageClass>;

/**
 * MANDATORY on every passport. A confidenceScore rendered without its
 * coverageClass is a bug, not a shortcut — the same low number means opposite
 * things in different coverage classes.
 */
export const Coverage = z.object({
  acquisitionMode: AcquisitionMode,
  region: z.string().nullable(),
  coverageClass: CoverageClass,
  /** identifying / total registers. A meter, NOT a probability. */
  coverageRatio: z.number().min(0).max(1),
  identifyingRegisters: z.array(
    z.object({ id: z.string(), name: z.string(), requires: z.string() }),
  ),
  weakRegisters: z.array(
    z.object({ id: z.string(), name: z.string(), why: z.string() }),
  ),
  blindRegisters: z.array(
    z.object({ id: z.string(), name: z.string(), why: z.string() }),
  ),
  /** What a quiet result from this register set is actually worth. */
  note: z.string(),
  /** Scores are comparable only within a coverage class. */
  comparability: z.string(),
});
export type Coverage = z.infer<typeof Coverage>;

/* -------------------------------------------------------------------------- */
/* Object identity & forensics                                                 */
/* -------------------------------------------------------------------------- */

export const ForensicSignal = z.object({
  name: z.string(),
  value: z.number(),
  interpretation: z.string(),
  severity: z.enum(["low", "medium", "high"]),
});
export type ForensicSignal = z.infer<typeof ForensicSignal>;

/**
 * PROVENANCE: Ethical-Tech-CoLab/digital-passport-artworks (@ChristineLumen).
 * forgeryRisk is a SEPARATE number from confidenceScore and must never be
 * merged with it.
 */
export const ObjectIdentity = z.object({
  sha256: z.string(),
  dHash: z.string(),
  angleCount: z.number().nullable(),
  embeddingRef: z.string().nullable(),
  duplicateOf: z.string().nullable(),
  similarityScore: z.number().min(0).max(1).nullable(),
  forgeryRisk: z
    .object({
      score: z.number().min(0).max(100),
      signals: z.array(ForensicSignal),
    })
    .nullable(),
});
export type ObjectIdentity = z.infer<typeof ObjectIdentity>;

/* -------------------------------------------------------------------------- */
/* Payments                                                                    */
/* -------------------------------------------------------------------------- */

export const PremiumCheck = z.object({
  vendor: z.string(),
  result: z.unknown(),
  paymentTx: z.string().nullable(),
  amountUsd: z.number(),
  network: z.string(),
  facilitator: z.string(),
  mode: z.enum(["live", "mock", "skipped"]),
  reasoning: z.string(),
});
export type PremiumCheck = z.infer<typeof PremiumCheck>;

/* -------------------------------------------------------------------------- */
/* Issuance, disclosure, lifecycle, notarisation                               */
/* -------------------------------------------------------------------------- */

/**
 * Two issuer classes, one envelope — ADR-004.
 *
 *  pseudonymous-wallet   secp256k1 / EIP-191 / did:pkh
 *                        "an identified-but-unnamed party asserts this"
 *  accredited-institution  ECDSA P-256 chained to a governance root
 *                        "an accredited body vouches for this, revocably"
 */
export const IssuerClass = z.enum(["pseudonymous-wallet", "accredited-institution"]);
export type IssuerClass = z.infer<typeof IssuerClass>;

export const Issuer = z.object({
  name: z.string(),
  issuerClass: IssuerClass,
  /** did:pkh for wallets; the issuing CA subject for institutions. */
  id: z.string(),
  /** 0x address (wallet class) or null. */
  wallet: z.string().nullable(),
  /** Certificate chain, leaf first (institution class) or null. */
  certificateChain: z.array(z.string()).nullable(),
});
export type Issuer = z.infer<typeof Issuer>;

/**
 * The field→tier map, signed into the passport so the disclosure boundary is a
 * property of the record rather than of whichever client renders it. ADR-005.
 * Keys are dot paths, e.g. `artwork.title`, `provenanceTimeline`.
 */
export const DisclosureEnvelope = z.object({
  envelopeVersion: z.string(),
  defaultTier: DisclosureTier,
  fieldTiers: z.record(z.string(), DisclosureTier),
});
export type DisclosureEnvelope = z.infer<typeof DisclosureEnvelope>;

/** PROVENANCE: Ethical-Tech-CoLab/digital-passport-artworks. */
export const CredentialStatus = z.object({
  type: z.literal("StatusList2021Entry"),
  statusPurpose: z.enum(["revocation"]),
  statusListIndex: z.number().int().nonnegative(),
  statusListCredential: z.string(),
});
export type CredentialStatus = z.infer<typeof CredentialStatus>;

/** PROVENANCE: yorkerhodes3/dpa-prototype. Hash only — never content. ADR-006. */
export const Notarisation = z.object({
  chain: z.literal("base-sepolia"),
  chainId: z.literal(84532),
  easUid: z.string().nullable(),
  txHash: z.string().nullable(),
  attestedAt: z.string().nullable(),
  mode: z.enum(["live", "mock"]),
  schemaUid: z.string().nullable(),
});
export type Notarisation = z.infer<typeof Notarisation>;

/* -------------------------------------------------------------------------- */
/* The passport                                                                */
/* -------------------------------------------------------------------------- */

export const Artwork = z.object({
  title: z.string(),
  artist: z.string().nullable(),
  period: z.string().nullable(),
  culture: z.string().nullable(),
  material: z.string().nullable(),
  dimensions: z.string().nullable(),
  currentLocation: z.string().nullable(),
  imageHash: z.string().nullable(),
  imageUrl: z.string().nullable(),
});
export type Artwork = z.infer<typeof Artwork>;

export const ClaimStatus = z.enum([
  "none",
  "informal-inquiry",
  "formal-claim",
  "under-negotiation",
  "resolved-returned",
  "resolved-retained",
]);
export type ClaimStatus = z.infer<typeof ClaimStatus>;

export const Passport = z.object({
  "@context": z.unknown(),
  type: z.literal("DigitalProvenancePassport"),
  schemaVersion: z.string(),
  id: z.string(),

  artwork: Artwork,
  objectIdentity: ObjectIdentity,

  provenanceTimeline: z.array(TimelineEvent),
  registryChecks: z.array(RegistryCheckRecord),
  premiumChecks: z.array(PremiumCheck),

  riskAssessment: z.object({
    confidenceScore: z.number().min(0).max(100),
    /** Mandatory. Never folded into confidenceScore. ADR-003. */
    coverage: Coverage,
    flags: z.array(RiskFlag),
    scorer: z.literal("accumulation-v0.4"),
  }),

  /** Community-facing state. Tagged `source-community` in the envelope. */
  claimStatus: ClaimStatus,
  custodianship: z.string().nullable(),
  sourceCommunityStatement: z.string().nullable(),

  /** Institution-facing. */
  condition: z.string().nullable(),
  loanEligibility: z.string().nullable(),

  /** Enforcement-facing. */
  holderPseudonym: z.string().nullable(),
  contactEscrow: z.string().nullable(),

  /** Owner-only. */
  holderIdentity: z.string().nullable(),

  issuer: Issuer,
  disclosure: DisclosureEnvelope,
  credentialStatus: CredentialStatus,
  notarisation: Notarisation.nullable(),

  issuedAt: z.string(),
  /** keccak256 / sha256 of the canonical payload excluding `signature`. */
  contentHash: z.string(),
  signature: z.string(),
});
export type Passport = z.infer<typeof Passport>;

/**
 * A passport as delivered to a specific role. Every field the role may not see
 * is ABSENT — not nulled, not masked. Redaction happens at the boundary and the
 * delivered document is the proof.
 */
export type RedactedPassport = Partial<Passport> & {
  id: string;
  type: "DigitalProvenancePassport";
  _redaction: {
    role: string;
    visibleTiers: string[];
    withheldFields: string[];
    envelopeVersion: string;
  };
};

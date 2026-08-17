/**
 * The DPA v0.4 pipeline — the seven stages, in order, wired end to end.
 *
 * PROVENANCE: new for v0.4. The stage sequence generalises the flow in
 *   Ethical-Tech-CoLab/arts-provenance-agent (src/web/pipeline.ts), with
 *   coverage, disclosure, and notarisation added as first-class stages.
 *
 * ---------------------------------------------------------------------------
 *   1  IDENTIFY    what is this object, and is the image what it claims to be
 *   2  INVESTIGATE what sourced evidence exists about it
 *   3  ASSESS      three independent numbers (ADR-002, ADR-003)
 *   4  ROUTE       may this be signed unattended, or must a human look
 *   5  ENVELOPE    which role may see which field (ADR-005)
 *   6  ISSUE       sign it, as one of two issuer classes (ADR-004)
 *   7  NOTARISE    commit the hash, never the content (ADR-006)
 * ---------------------------------------------------------------------------
 *
 * Redaction is deliberately NOT a stage. It happens at the delivery boundary,
 * once per requesting role, against the finished passport — see `deliver()`.
 * Making it a pipeline stage would imply there exists some point at which a
 * passport is "the redacted one", when in fact one signed record has as many
 * lawful views as there are roles.
 */

import type {
  Passport,
  Role,
  RedactedPassport,
  Coverage,
  ObjectIdentity,
  ForensicSignal,
  RiskFlag,
  TimelineEvent,
  RegistryCheckRecord,
  PremiumCheck,
  Issuer,
  ClaimStatus,
} from "@dpa/schema";
import { PASSPORT_CONTEXT, PASSPORT_SCHEMA_VERSION } from "@dpa/schema";
import { gatherEvidence, type RecordedEvidence } from "@dpa/evidence";
import { assess, type BreakdownEntry } from "@dpa/assess";
import { route, type RoutingDecision } from "@dpa/lifecycle";
import { buildEnvelope, redactForRole, assertNoLeakage, notarisePassport, computeContentHash } from "@dpa/govern";
import { signAsWallet, deterministicWalletIssuer, contentHash as issueContentHash } from "@dpa/issue";

/* -------------------------------------------------------------------------- */
/* Input                                                                       */
/* -------------------------------------------------------------------------- */

export interface PipelineInput {
  id: string;
  artwork: Passport["artwork"];
  /** Precomputed identity. Fixture runs supply this; live runs derive it. */
  objectIdentity: Omit<ObjectIdentity, "forgeryRisk">;
  /**
   * Forensic signals about the IMAGE. Kept separate from provenance evidence
   * because they answer a different question — "is this a fake?" rather than
   * "was this looted?" — and the two must not end up on one scale.
   */
  forensicSignals?: ForensicSignal[];
  /** Pre-recorded evidence for fixture runs. Omit to query connectors live. */
  recorded?: RecordedEvidence;
  premiumChecks?: PremiumCheck[];
  coverage: {
    acquisitionMode: Coverage["acquisitionMode"];
    region: string | null;
    corpus?: string;
    /** Whether the object was recorded before removal. See CoverageInput. */
    everInventoried?: boolean;
  };
  valuation?: { price: number; comparableMedian: number } | null;

  claimStatus: ClaimStatus;
  custodianship: string | null;
  sourceCommunityStatement: string | null;
  condition: string | null;
  loanEligibility: string | null;
  holderPseudonym: string | null;
  contactEscrow: string | null;
  holderIdentity: string | null;

  issuerName: string;
  /** Seed for the demo signing key. See deterministicWalletIssuer. */
  issuerSeed: string;
  statusListIndex: number;
  statusListCredential: string;
  issuedAt: string;
  mode?: "fixtures" | "live";
}

export interface PipelineResult {
  passport: Passport;
  routing: RoutingDecision;
  issuer: Issuer;
  timeline: TimelineEvent[];
  registryChecks: RegistryCheckRecord[];
  flags: RiskFlag[];
  sourcesConsulted: string[];
  /** Ordered scoring steps, so the number can be recomputed by hand. */
  breakdown: BreakdownEntry[];
}

/* -------------------------------------------------------------------------- */
/* The pipeline                                                                */
/* -------------------------------------------------------------------------- */

export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  const mode = input.mode ?? "fixtures";

  // ── 1  IDENTIFY ──────────────────────────────────────────────────────────
  // Fixture runs carry a precomputed fingerprint so the build stays offline
  // and byte-identical between runs. Forgery risk is computed below, in the
  // assess stage, and written back here — it is a third number, independent
  // of the provenance score and of coverage.
  const fingerprint = input.objectIdentity;

  // ── 2  INVESTIGATE ───────────────────────────────────────────────────────
  const gathered = await gatherEvidence(
    {
      title: input.artwork.title,
      artist: input.artwork.artist ?? undefined,
    },
    { mode, ...(input.recorded ? { recorded: input.recorded } : {}) },
  );

  // ── 3  ASSESS ────────────────────────────────────────────────────────────
  // Three numbers, computed independently, never combined.
  const riskRelevantHits = gathered.registryChecks.flatMap((c) =>
    c.hits.filter((h) => h.riskRelevant).map((h) => ({ claim: h.claim, sourceUrl: h.source })),
  );

  const assessed = assess({
    timeline: gathered.timeline,
    registry: {
      riskRelevantHits,
      notQueryable: gathered.registryChecks.filter((c) => c.verdict === "not-queryable").length,
      checks: gathered.registryChecks.map((c) => ({
        verdict: c.verdict,
        referralUrl: c.officialSearch,
      })),
    },
    valuation: input.valuation ?? null,
    region: input.coverage.region,
    acquisitionMode: input.coverage.acquisitionMode,
    ...(input.coverage.corpus !== undefined ? { corpus: input.coverage.corpus } : {}),
    ...(input.coverage.everInventoried !== undefined
      ? { everInventoried: input.coverage.everInventoried }
      : {}),
    forensicSignals: input.forensicSignals ?? [],
  });

  const objectIdentity: ObjectIdentity = {
    ...fingerprint,
    forgeryRisk:
      (input.forensicSignals ?? []).length > 0
        ? { score: assessed.forgeryRisk.score, signals: assessed.forgeryRisk.signals }
        : null,
  };

  // ── 4  ROUTE ─────────────────────────────────────────────────────────────
  // Coverage gates this, not the score alone. See lifecycle/review.ts.
  const routing = route({
    confidenceScore: assessed.confidenceScore,
    coverageClass: assessed.coverage.coverageClass,
    duplicateConfirmed: objectIdentity.duplicateOf !== null,
    similarityNeedsReview:
      objectIdentity.similarityScore !== null && objectIdentity.similarityScore > 0.85,
  });

  // ── 5  ENVELOPE ──────────────────────────────────────────────────────────
  // The field→tier map is signed INTO the passport, so the disclosure boundary
  // travels with the record rather than living in whichever client renders it.
  const disclosure = buildEnvelope();

  // ── 6  ISSUE ─────────────────────────────────────────────────────────────
  const { issuer, privateKey } = deterministicWalletIssuer(input.issuerSeed, input.issuerName);

  const body: Omit<Passport, "signature"> = {
    "@context": PASSPORT_CONTEXT,
    type: "DigitalProvenancePassport",
    schemaVersion: PASSPORT_SCHEMA_VERSION,
    id: input.id,

    artwork: input.artwork,
    objectIdentity,

    provenanceTimeline: gathered.timeline,
    registryChecks: gathered.registryChecks,
    premiumChecks: input.premiumChecks ?? [],

    riskAssessment: {
      confidenceScore: assessed.confidenceScore,
      coverage: assessed.coverage,
      flags: assessed.flags,
      scorer: "accumulation-v0.4",
    },

    claimStatus: input.claimStatus,
    custodianship: input.custodianship,
    sourceCommunityStatement: input.sourceCommunityStatement,
    condition: input.condition,
    loanEligibility: input.loanEligibility,
    holderPseudonym: input.holderPseudonym,
    contactEscrow: input.contactEscrow,
    holderIdentity: input.holderIdentity,

    issuer,
    disclosure,
    credentialStatus: {
      type: "StatusList2021Entry",
      statusPurpose: "revocation",
      statusListIndex: input.statusListIndex,
      statusListCredential: input.statusListCredential,
    },
    notarisation: null,

    issuedAt: input.issuedAt,
    contentHash: "",
  };

  // The hash seals everything except the sealing fields themselves.
  const hash = computeContentHash(body as unknown as Record<string, unknown>);
  const sealed: Omit<Passport, "signature"> = { ...body, contentHash: hash };
  const signature = signAsWallet(sealed, privateKey);

  const passport: Passport = { ...sealed, signature };

  // ── 7  NOTARISE ──────────────────────────────────────────────────────────
  // The chain sees a hash and nothing else. No title, no location, no holder.
  const { notarisation } = await notarisePassport(passport);
  passport.notarisation = notarisation;

  return {
    passport,
    routing,
    issuer,
    timeline: gathered.timeline,
    registryChecks: gathered.registryChecks,
    flags: assessed.flags,
    sourcesConsulted: gathered.sourcesConsulted,
    breakdown: assessed.breakdown,
  };
}

/* -------------------------------------------------------------------------- */
/* Delivery                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Produce the view of a passport that one role is entitled to see.
 *
 * Every withheld field is ABSENT from the returned object, not nulled and not
 * masked, and `assertNoLeakage` re-reads the result to prove it. A nulled field
 * still tells the reader that the field exists and that they were refused it;
 * for `holderIdentity` under a repatriation claim, that inference is itself the
 * disclosure the envelope is meant to prevent.
 */
export function deliver(passport: Passport, role: Role): RedactedPassport {
  const view = redactForRole(passport, role);
  assertNoLeakage(view, role, passport.disclosure);
  return view;
}

export { issueContentHash };

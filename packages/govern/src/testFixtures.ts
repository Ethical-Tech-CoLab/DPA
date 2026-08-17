/**
 * Test fixture: a fully-populated passport covering every field in the schema.
 *
 * The contentHash is computed at import time so it always reflects the
 * canonical form of this fixture. Tests that mutate the passport should
 * use `structuredClone(makePassport())` to avoid cross-test contamination.
 */

import type { Passport } from "@dpa/schema";
import { DEFAULT_FIELD_TIERS, ENVELOPE_VERSION } from "@dpa/schema";
import { computeContentHash } from "./notarise.js";

/** Build a fully-populated Passport with a correct contentHash. */
export function makePassport(): Passport {
  const base: Omit<Passport, "contentHash" | "signature"> = {
    "@context": {
      "@vocab": "https://schema.org/",
      prov: "http://www.w3.org/ns/prov#",
      passport: "https://ethical-tech-colab.github.io/DPA/ns#",
    },
    type: "DigitalProvenancePassport",
    schemaVersion: "0.4.0",
    id: "test-passport-001",

    artwork: {
      title: "Terracotta Head",
      artist: "Unknown Ife artist",
      period: "12th–14th century CE",
      culture: "Yoruba / Ife",
      material: "Terracotta",
      dimensions: "29.5 cm height",
      currentLocation: "Museum Store, London, UK",
      imageHash: "0xdeadbeef",
      imageUrl: "https://example.com/image.jpg",
    },

    objectIdentity: {
      sha256: "0xabc123",
      dHash: "0xdef456",
      angleCount: 4,
      embeddingRef: "embed://v1/001",
      duplicateOf: null,
      similarityScore: null,
      forgeryRisk: {
        score: 12,
        signals: [
          {
            name: "pigment_anomaly",
            value: 0.12,
            interpretation: "Minor spectral anomaly — inconclusive",
            severity: "low",
          },
        ],
      },
    },

    provenanceTimeline: [
      {
        event: "Excavated",
        date: "1938",
        location: "Ife, Nigeria",
        source: "https://example.com/source1",
        sourceType: "museum-record",
        verifiedBy: "British Museum",
        tier: "verifiedByAuthority",
        confidence: 0.9,
        isGeneralKnowledge: false,
      },
      {
        event: "Sold at auction",
        date: "1968",
        location: "London",
        source: "https://example.com/source2",
        sourceType: "auction-record",
        verifiedBy: "Sotheby's",
        tier: "verifiedByAuthority",
        confidence: 0.75,
        isGeneralKnowledge: false,
      },
      {
        event: "Acquired by private collector",
        date: "1970",
        location: "Unknown",
        source: "inferred-from-sale",
        sourceType: "inferred",
        verifiedBy: "n/a",
        tier: "inferred",
        confidence: 0.4,
        isGeneralKnowledge: true,
      },
    ],

    registryChecks: [
      {
        registry: "Art Loss Register",
        assertedBy: "DPA Agent v0.4",
        access: "structured-api",
        verdict: "no-evidence-found",
        method: "API query on SHA-256 hash",
        caveat: "Does not cover post-2000 thefts in all jurisdictions",
        hits: [],
        officialSearch: "https://alr.example.com/search/001",
        checkedAt: "2026-01-15T10:00:00Z",
      },
    ],

    premiumChecks: [
      {
        vendor: "ArtGuard",
        result: { status: "clean" },
        paymentTx: null,
        amountUsd: 0,
        network: "base-sepolia",
        facilitator: "x402",
        mode: "mock",
        reasoning: "Mock mode — no network call",
      },
    ],

    riskAssessment: {
      confidenceScore: 42,
      coverage: {
        acquisitionMode: "colonial",
        region: "West Africa",
        coverageClass: "structurally-uncovered",
        coverageRatio: 0.12,
        identifyingRegisters: [
          { id: "alr", name: "Art Loss Register", requires: "structured-api" },
        ],
        weakRegisters: [],
        blindRegisters: [
          { id: "interpol", name: "INTERPOL Stolen Works", why: "No public API" },
        ],
        note: "Colonial-era acquisitions are largely absent from registers",
        comparability:
          "Score is comparable only within structurally-uncovered colonial objects",
      },
      flags: [
        {
          type: "lootingSignal",
          severity: "high",
          evidence: "No documented chain of title before 1968",
          source: "https://example.com/source2",
        },
        {
          type: "repatriationPrecedent",
          severity: "medium",
          evidence: "Nigeria has formally requested return of Ife bronzes",
          source: "https://example.com/press",
        },
      ],
      scorer: "accumulation-v0.4",
    },

    claimStatus: "formal-claim",
    custodianship:
      "Held under temporary loan agreement pending repatriation negotiations",
    sourceCommunityStatement:
      "The Ooni of Ife has formally requested return. This object is sacred.",

    condition: "Stable — minor surface erosion, no active deterioration",
    loanEligibility:
      "Not eligible for loan pending resolution of repatriation claim",

    holderPseudonym: "0xHolder9f3a",
    contactEscrow: "escrow://encrypted/holder9f3a",
    holderIdentity: "Dr. Jane Smith, 12 Gallery Road, London W1A 1AB",

    issuer: {
      name: "DPA Test Issuer",
      issuerClass: "pseudonymous-wallet",
      id: "did:pkh:eip155:84532:0xTestWallet",
      wallet: "0xTestWallet",
      certificateChain: null,
    },

    disclosure: {
      envelopeVersion: ENVELOPE_VERSION,
      defaultTier: "owner",
      fieldTiers: { ...DEFAULT_FIELD_TIERS },
    },

    credentialStatus: {
      type: "StatusList2021Entry",
      statusPurpose: "revocation",
      statusListIndex: 1,
      statusListCredential: "https://example.com/status/1",
    },

    notarisation: null,

    issuedAt: "2026-01-15T10:00:00Z",
  };

  // Compute the correct contentHash using the same logic as computeContentHash:
  // excludes notarisation, contentHash, and signature (sealing fields).
  const contentHash = computeContentHash(base as unknown as Record<string, unknown>);

  return {
    ...base,
    contentHash,
    signature: "0xsig_test_fixture",
  } as Passport;
}

import { describe, it, expect } from "vitest";
import { StatusList } from "./statusList.js";
import { amendPassport } from "./amend.js";
import type { Passport } from "@dpa/schema";

/** Minimal valid Passport for amendment tests. */
function makePassport(sl: StatusList): Passport {
  const idx = sl.allocateIndex();
  return {
    "@context": { "@vocab": "https://schema.org/" },
    type: "DigitalProvenancePassport" as const,
    schemaVersion: "0.4.0",
    id: `dpa-test-${Date.now()}`,
    artwork: {
      title: "Original Title",
      artist: null,
      period: null,
      culture: null,
      material: null,
      dimensions: null,
      currentLocation: null,
      imageHash: null,
      imageUrl: null,
    },
    objectIdentity: {
      sha256: "abc",
      dHash: "0000000000000000",
      angleCount: null,
      embeddingRef: null,
      duplicateOf: null,
      similarityScore: null,
      forgeryRisk: null,
    },
    provenanceTimeline: [],
    registryChecks: [],
    premiumChecks: [],
    riskAssessment: {
      confidenceScore: 50,
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
    },
    claimStatus: "none" as const,
    custodianship: null,
    sourceCommunityStatement: null,
    condition: null,
    loanEligibility: null,
    holderPseudonym: null,
    contactEscrow: null,
    holderIdentity: null,
    issuer: {
      name: "Test Issuer",
      issuerClass: "pseudonymous-wallet" as const,
      id: "did:pkh:eip155:84532:0xabc",
      wallet: "0xabc",
      certificateChain: null,
    },
    disclosure: {
      envelopeVersion: "0.4.0",
      defaultTier: "owner" as const,
      fieldTiers: {},
    },
    credentialStatus: sl.buildStatusListCredential(idx, "https://example.com/list"),
    notarisation: null,
    issuedAt: new Date().toISOString(),
    contentHash: "aabbcc",
    signature: "ddeeff",
  };
}

/** A fake signer that just records what it was called with. */
function fakeSigner(body: Omit<Passport, "signature">): { signature: string; contentHash: string } {
  // Minimal deterministic fake
  const hash = `hash-of-${JSON.stringify(body).length}`;
  return { signature: "fake-sig", contentHash: hash };
}

describe("amendment", () => {
  it("amendment revokes predecessor and links supersedes", () => {
    const sl = new StatusList();
    const prev = makePassport(sl);
    const prevIdx = prev.credentialStatus.statusListIndex;

    const amended = amendPassport(
      prev,
      { artwork: { ...prev.artwork, title: "Amended Title" } },
      fakeSigner,
      sl,
      "https://example.com/list",
    );

    // Predecessor is revoked
    expect(sl.isRevoked(prevIdx)).toBe(true);

    // New passport references predecessor
    expect(amended.supersedes).toBe(prev.id);

    // New passport has a different id
    expect(amended.id).not.toBe(prev.id);

    // New passport has a new status list index (different from predecessor)
    expect(amended.credentialStatus.statusListIndex).not.toBe(prevIdx);

    // New passport has the amended title
    expect(amended.artwork.title).toBe("Amended Title");
  });

  it("amended passport is not revoked at birth", () => {
    const sl = new StatusList();
    const prev = makePassport(sl);
    const amended = amendPassport(
      prev,
      {},
      fakeSigner,
      sl,
      "https://example.com/list",
    );
    expect(sl.isRevoked(amended.credentialStatus.statusListIndex)).toBe(false);
  });
});

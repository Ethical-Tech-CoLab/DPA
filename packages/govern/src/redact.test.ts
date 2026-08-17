/**
 * Tests for the confidentiality envelope redaction engine.
 *
 * These tests are the security boundary. Every assertion here corresponds to a
 * real access-control invariant. Failures are not "test failures" — they are
 * disclosure boundary violations.
 */

import { describe, it, expect } from "vitest";
import {
  redactForRole,
  resolveTier,
  assertNoLeakage,
} from "./index.js";
import { ALL_ROLES } from "@dpa/schema";
import type { Role } from "@dpa/schema";
import { makePassport } from "./testFixtures.js";

// ---------------------------------------------------------------------------
// resolveTier — precedence
// ---------------------------------------------------------------------------

describe("resolveTier", () => {
  const envelope = makePassport().disclosure;

  it("returns the most specific path match", () => {
    expect(resolveTier("artwork.dimensions", envelope)).toBe("museum");
    expect(resolveTier("artwork.currentLocation", envelope)).toBe("enforcement");
    expect(resolveTier("artwork.title", envelope)).toBe("public");
  });

  it("falls back to the parent path when no specific entry exists", () => {
    // objectIdentity.angleCount has no entry → falls to objectIdentity (museum)
    expect(resolveTier("objectIdentity.angleCount", envelope)).toBe("museum");
    // objectIdentity.embeddingRef has no entry → falls to objectIdentity (museum)
    expect(resolveTier("objectIdentity.embeddingRef", envelope)).toBe("museum");
  });

  it("returns defaultTier when no path matches at all", () => {
    expect(resolveTier("unknownField.deep.path", envelope)).toBe("owner");
  });

  it("specific path beats parent", () => {
    // objectIdentity → museum, but sha256 and dHash are specifically public
    expect(resolveTier("objectIdentity.sha256", envelope)).toBe("public");
    expect(resolveTier("objectIdentity.dHash", envelope)).toBe("public");
    // forgeryRisk is explicitly museum (same as parent, but confirms no regression)
    expect(resolveTier("objectIdentity.forgeryRisk", envelope)).toBe("museum");
    // duplicateOf and similarityScore are enforcement
    expect(resolveTier("objectIdentity.duplicateOf", envelope)).toBe("enforcement");
    expect(resolveTier("objectIdentity.similarityScore", envelope)).toBe("enforcement");
  });

  it("three-level paths fall back correctly", () => {
    // artwork.artist → specifically public
    expect(resolveTier("artwork.artist", envelope)).toBe("public");
    // riskAssessment.flags → specifically museum
    expect(resolveTier("riskAssessment.flags", envelope)).toBe("museum");
    // riskAssessment.unknown → falls to riskAssessment (public)
    expect(resolveTier("riskAssessment.unknown", envelope)).toBe("public");
  });
});

// ---------------------------------------------------------------------------
// Helper — field is absent (not null, not undefined, ABSENT)
// ---------------------------------------------------------------------------

function isAbsent(obj: Record<string, unknown>, key: string): boolean {
  return !(key in obj);
}

// ---------------------------------------------------------------------------
// assertNoLeakage — all roles pass on the fixture
// ---------------------------------------------------------------------------

describe("assertNoLeakage — all roles on fully-populated passport", () => {
  const passport = makePassport();

  for (const role of ALL_ROLES) {
    it(`role "${role}" produces a clean redacted document`, () => {
      const redacted = redactForRole(passport, role);
      expect(() =>
        assertNoLeakage(redacted, role, passport.disclosure),
      ).not.toThrow();
    });
  }
});

// ---------------------------------------------------------------------------
// public role
// ---------------------------------------------------------------------------

describe("public role", () => {
  const passport = makePassport();
  const redacted = redactForRole(passport, "public");

  it("never receives holderIdentity", () => {
    expect(isAbsent(redacted as Record<string, unknown>, "holderIdentity")).toBe(true);
  });

  it("never receives holderPseudonym", () => {
    expect(isAbsent(redacted as Record<string, unknown>, "holderPseudonym")).toBe(true);
  });

  it("never receives contactEscrow", () => {
    expect(isAbsent(redacted as Record<string, unknown>, "contactEscrow")).toBe(true);
  });

  it("never receives provenanceTimeline (but gets count)", () => {
    expect(isAbsent(redacted as Record<string, unknown>, "provenanceTimeline")).toBe(true);
    expect((redacted as Record<string, unknown>)["provenanceTimelineCount"]).toBe(3);
  });

  it("never receives registryChecks (but gets count)", () => {
    expect(isAbsent(redacted as Record<string, unknown>, "registryChecks")).toBe(true);
    expect((redacted as Record<string, unknown>)["registryChecksCount"]).toBe(1);
  });

  it("never receives artwork.currentLocation", () => {
    const art = (redacted as Record<string, unknown>)["artwork"] as Record<string, unknown>;
    expect(art).toBeDefined();
    expect(isAbsent(art, "currentLocation")).toBe(true);
  });

  it("does receive artwork.title, artist, culture", () => {
    const art = (redacted as Record<string, unknown>)["artwork"] as Record<string, unknown>;
    expect(art["title"]).toBe("Terracotta Head");
    expect(art["artist"]).toBe("Unknown Ife artist");
    expect(art["culture"]).toBe("Yoruba / Ife");
  });

  it("does NOT receive artwork.dimensions (museum)", () => {
    const art = (redacted as Record<string, unknown>)["artwork"] as Record<string, unknown>;
    expect(isAbsent(art, "dimensions")).toBe(true);
  });

  it("receives objectIdentity.sha256 and dHash but NOT deeper fields", () => {
    const oi = (redacted as Record<string, unknown>)["objectIdentity"] as Record<string, unknown>;
    expect(oi).toBeDefined();
    expect(oi["sha256"]).toBe("0xabc123");
    expect(oi["dHash"]).toBe("0xdef456");
    // museum tier fields withheld
    expect(isAbsent(oi, "forgeryRisk")).toBe(true);
    expect(isAbsent(oi, "angleCount")).toBe(true);
    expect(isAbsent(oi, "embeddingRef")).toBe(true);
    // enforcement tier fields withheld
    expect(isAbsent(oi, "duplicateOf")).toBe(true);
    expect(isAbsent(oi, "similarityScore")).toBe(true);
  });

  it("receives riskAssessment (public) with flagsCount but no flags", () => {
    const ra = (redacted as Record<string, unknown>)["riskAssessment"] as Record<string, unknown>;
    expect(ra).toBeDefined();
    expect(ra["confidenceScore"]).toBe(42);
    expect(isAbsent(ra, "flags")).toBe(true);
    expect(ra["flagsCount"]).toBe(2);
  });

  it("contentHash and signature always present", () => {
    expect((redacted as Record<string, unknown>)["contentHash"]).toBeDefined();
    expect((redacted as Record<string, unknown>)["signature"]).toBeDefined();
  });

  it("does NOT receive source-community fields", () => {
    expect(isAbsent(redacted as Record<string, unknown>, "claimStatus")).toBe(true);
    expect(isAbsent(redacted as Record<string, unknown>, "custodianship")).toBe(true);
    expect(isAbsent(redacted as Record<string, unknown>, "sourceCommunityStatement")).toBe(true);
  });

  it("does NOT receive museum fields", () => {
    expect(isAbsent(redacted as Record<string, unknown>, "condition")).toBe(true);
    expect(isAbsent(redacted as Record<string, unknown>, "loanEligibility")).toBe(true);
  });

  it("_redaction is populated correctly", () => {
    expect(redacted._redaction.role).toBe("public");
    expect(redacted._redaction.visibleTiers).toContain("public");
    expect(redacted._redaction.visibleTiers).not.toContain("museum");
    expect(redacted._redaction.withheldFields).toContain("provenanceTimeline");
    expect(redacted._redaction.withheldFields).toContain("holderIdentity");
  });
});

// ---------------------------------------------------------------------------
// source-community role — orthogonality is the subtlest rule
// ---------------------------------------------------------------------------

describe("source-community role — orthogonality", () => {
  const passport = makePassport();
  const redacted = redactForRole(passport, "source-community");
  const obj = redacted as Record<string, unknown>;

  it("sees public fields", () => {
    const art = obj["artwork"] as Record<string, unknown>;
    expect(art["title"]).toBeDefined();
    expect(art["artist"]).toBeDefined();
  });

  it("sees claimStatus, custodianship, sourceCommunityStatement", () => {
    expect(obj["claimStatus"]).toBe("formal-claim");
    expect(obj["custodianship"]).toBeDefined();
    expect(obj["sourceCommunityStatement"]).toBeDefined();
  });

  it("does NOT receive condition or loanEligibility (museum tier)", () => {
    expect(isAbsent(obj, "condition")).toBe(true);
    expect(isAbsent(obj, "loanEligibility")).toBe(true);
  });

  it("does NOT receive artwork.dimensions (museum tier)", () => {
    const art = obj["artwork"] as Record<string, unknown>;
    expect(isAbsent(art, "dimensions")).toBe(true);
  });

  it("does NOT receive provenanceTimeline or registryChecks (enforcement tier)", () => {
    expect(isAbsent(obj, "provenanceTimeline")).toBe(true);
    expect(isAbsent(obj, "registryChecks")).toBe(true);
  });

  it("does NOT receive holderPseudonym or contactEscrow (enforcement tier)", () => {
    expect(isAbsent(obj, "holderPseudonym")).toBe(true);
    expect(isAbsent(obj, "contactEscrow")).toBe(true);
  });

  it("does NOT receive holderIdentity (owner tier)", () => {
    expect(isAbsent(obj, "holderIdentity")).toBe(true);
  });

  it("does NOT receive objectIdentity.forgeryRisk (museum tier)", () => {
    const oi = obj["objectIdentity"] as Record<string, unknown>;
    expect(isAbsent(oi, "forgeryRisk")).toBe(true);
  });

  it("does NOT receive riskAssessment.flags (museum tier) — gets count", () => {
    const ra = obj["riskAssessment"] as Record<string, unknown>;
    expect(isAbsent(ra, "flags")).toBe(true);
    expect(ra["flagsCount"]).toBe(2);
  });

  it("_redaction lists source-community and public as visible tiers only", () => {
    const tiers = redacted._redaction.visibleTiers;
    expect(tiers).toContain("public");
    expect(tiers).toContain("source-community");
    expect(tiers).not.toContain("museum");
    expect(tiers).not.toContain("enforcement");
    expect(tiers).not.toContain("owner");
  });
});

// ---------------------------------------------------------------------------
// museum role
// ---------------------------------------------------------------------------

describe("museum role", () => {
  const passport = makePassport();
  const redacted = redactForRole(passport, "museum");
  const obj = redacted as Record<string, unknown>;

  it("sees condition and loanEligibility", () => {
    expect(obj["condition"]).toBeDefined();
    expect(obj["loanEligibility"]).toBeDefined();
  });

  it("sees artwork.dimensions", () => {
    const art = obj["artwork"] as Record<string, unknown>;
    expect(art["dimensions"]).toBeDefined();
  });

  it("sees riskAssessment.flags", () => {
    const ra = obj["riskAssessment"] as Record<string, unknown>;
    expect(Array.isArray(ra["flags"])).toBe(true);
  });

  it("does NOT receive claimStatus or custodianship (source-community tier)", () => {
    expect(isAbsent(obj, "claimStatus")).toBe(true);
    expect(isAbsent(obj, "custodianship")).toBe(true);
    expect(isAbsent(obj, "sourceCommunityStatement")).toBe(true);
  });

  it("does NOT receive provenanceTimeline or registryChecks (enforcement tier)", () => {
    expect(isAbsent(obj, "provenanceTimeline")).toBe(true);
    expect(isAbsent(obj, "registryChecks")).toBe(true);
  });

  it("does NOT receive holderPseudonym, contactEscrow (enforcement tier)", () => {
    expect(isAbsent(obj, "holderPseudonym")).toBe(true);
    expect(isAbsent(obj, "contactEscrow")).toBe(true);
  });

  it("does NOT receive holderIdentity (owner tier)", () => {
    expect(isAbsent(obj, "holderIdentity")).toBe(true);
  });

  it("does NOT receive artwork.currentLocation (enforcement tier)", () => {
    const art = obj["artwork"] as Record<string, unknown>;
    expect(isAbsent(art, "currentLocation")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// enforcement role
// ---------------------------------------------------------------------------

describe("enforcement role", () => {
  const passport = makePassport();
  const redacted = redactForRole(passport, "enforcement");
  const obj = redacted as Record<string, unknown>;

  it("receives the full provenanceTimeline", () => {
    const timeline = obj["provenanceTimeline"] as unknown[];
    expect(Array.isArray(timeline)).toBe(true);
    expect(timeline.length).toBe(3);
  });

  it("receives registryChecks", () => {
    const checks = obj["registryChecks"] as unknown[];
    expect(Array.isArray(checks)).toBe(true);
    expect(checks.length).toBeGreaterThan(0);
  });

  it("receives holderPseudonym and contactEscrow", () => {
    expect(obj["holderPseudonym"]).toBe("0xHolder9f3a");
    expect(obj["contactEscrow"]).toBeDefined();
  });

  it("receives artwork.currentLocation", () => {
    const art = obj["artwork"] as Record<string, unknown>;
    expect(art["currentLocation"]).toBeDefined();
  });

  it("does NOT receive holderIdentity (owner only)", () => {
    expect(isAbsent(obj, "holderIdentity")).toBe(true);
  });

  it("does NOT receive source-community fields", () => {
    expect(isAbsent(obj, "claimStatus")).toBe(true);
    expect(isAbsent(obj, "custodianship")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// owner role — sees everything (modulo _redaction)
// ---------------------------------------------------------------------------

describe("owner role", () => {
  const passport = makePassport();
  const redacted = redactForRole(passport, "owner");
  const obj = redacted as Record<string, unknown>;

  it("receives holderIdentity", () => {
    expect(obj["holderIdentity"]).toBeDefined();
  });

  it("receives source-community fields", () => {
    expect(obj["claimStatus"]).toBeDefined();
    expect(obj["custodianship"]).toBeDefined();
  });

  it("receives museum fields", () => {
    expect(obj["condition"]).toBeDefined();
    expect(obj["loanEligibility"]).toBeDefined();
  });

  it("receives enforcement fields", () => {
    expect(Array.isArray(obj["provenanceTimeline"])).toBe(true);
    expect(Array.isArray(obj["registryChecks"])).toBe(true);
    expect(obj["holderPseudonym"]).toBeDefined();
  });

  it("_redaction.withheldFields is empty", () => {
    expect(redacted._redaction.withheldFields).toHaveLength(0);
  });

  it("_redaction.visibleTiers contains all tiers", () => {
    const tiers = redacted._redaction.visibleTiers;
    expect(tiers).toContain("public");
    expect(tiers).toContain("source-community");
    expect(tiers).toContain("museum");
    expect(tiers).toContain("enforcement");
    expect(tiers).toContain("owner");
  });
});

// ---------------------------------------------------------------------------
// Absence invariant — withheld fields are ABSENT, not null
// ---------------------------------------------------------------------------

describe("absence invariant", () => {
  it("withheld fields are absent from the object (not null, not undefined)", () => {
    const passport = makePassport();
    const redacted = redactForRole(passport, "public");
    const obj = redacted as Record<string, unknown>;

    // These should be absent (not present as any value including null)
    expect("holderIdentity" in obj).toBe(false);
    expect("holderPseudonym" in obj).toBe(false);
    expect("provenanceTimeline" in obj).toBe(false);
    expect("claimStatus" in obj).toBe(false);
    expect("condition" in obj).toBe(false);
  });

  it("count-only fields add a sibling, not a nulled original", () => {
    const passport = makePassport();
    const redacted = redactForRole(passport, "public");
    const obj = redacted as Record<string, unknown>;

    expect("provenanceTimeline" in obj).toBe(false);
    expect("provenanceTimelineCount" in obj).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// COUNT_ONLY_PUBLIC — all three paths
// ---------------------------------------------------------------------------

describe("count-only-public paths", () => {
  const passport = makePassport();

  it("public gets provenanceTimelineCount = 3", () => {
    const r = redactForRole(passport, "public") as Record<string, unknown>;
    expect(r["provenanceTimelineCount"]).toBe(3);
    expect("provenanceTimeline" in r).toBe(false);
  });

  it("public gets registryChecksCount = 1", () => {
    const r = redactForRole(passport, "public") as Record<string, unknown>;
    expect(r["registryChecksCount"]).toBe(1);
    expect("registryChecks" in r).toBe(false);
  });

  it("public gets riskAssessment.flagsCount = 2", () => {
    const ra = (redactForRole(passport, "public") as Record<string, unknown>)[
      "riskAssessment"
    ] as Record<string, unknown>;
    expect(ra["flagsCount"]).toBe(2);
    expect("flags" in ra).toBe(false);
  });

  it("source-community also gets counts for enforcement-tier arrays", () => {
    const r = redactForRole(passport, "source-community") as Record<string, unknown>;
    expect("provenanceTimeline" in r).toBe(false);
    expect(r["provenanceTimelineCount"]).toBe(3);
  });

  it("museum gets counts for enforcement-tier arrays but sees flags", () => {
    const r = redactForRole(passport, "museum") as Record<string, unknown>;
    expect("provenanceTimeline" in r).toBe(false);
    expect(r["provenanceTimelineCount"]).toBe(3);
    const ra = r["riskAssessment"] as Record<string, unknown>;
    expect(Array.isArray(ra["flags"])).toBe(true);
    expect("flagsCount" in ra).toBe(false);
  });

  it("enforcement sees all arrays, no counts", () => {
    const r = redactForRole(passport, "enforcement") as Record<string, unknown>;
    expect(Array.isArray(r["provenanceTimeline"])).toBe(true);
    expect(Array.isArray(r["registryChecks"])).toBe(true);
    expect("provenanceTimelineCount" in r).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// objectIdentity partial visibility — specific paths override container
// ---------------------------------------------------------------------------

describe("objectIdentity — specific-path overrides container", () => {
  it("public sees sha256 and dHash despite objectIdentity being museum-tier", () => {
    const passport = makePassport();
    const r = redactForRole(passport, "public") as Record<string, unknown>;
    const oi = r["objectIdentity"] as Record<string, unknown> | undefined;
    // objectIdentity should be present (has visible children)
    expect(oi).toBeDefined();
    expect(oi!["sha256"]).toBe("0xabc123");
    expect(oi!["dHash"]).toBe("0xdef456");
    // Museum-tier fields absent
    expect("forgeryRisk" in oi!).toBe(false);
    expect("angleCount" in oi!).toBe(false);
  });

  it("museum sees forgeryRisk and sha256 and dHash", () => {
    const passport = makePassport();
    const r = redactForRole(passport, "museum") as Record<string, unknown>;
    const oi = r["objectIdentity"] as Record<string, unknown>;
    expect(oi["sha256"]).toBe("0xabc123");
    expect(oi["forgeryRisk"]).toBeDefined();
    expect("duplicateOf" in oi).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tier precedence — explicit test
// ---------------------------------------------------------------------------

describe("tier precedence — specific overrides parent", () => {
  it("custom envelope: artwork.title overridden to owner hides it from public", () => {
    const passport = makePassport();
    const customPassport = {
      ...passport,
      disclosure: {
        ...passport.disclosure,
        fieldTiers: {
          ...passport.disclosure.fieldTiers,
          "artwork.title": "owner" as const,
        },
      },
    };

    const redacted = redactForRole(customPassport, "public");
    const art = (redacted as Record<string, unknown>)["artwork"] as
      | Record<string, unknown>
      | undefined;
    // artwork container is still public, but title is now owner
    if (art) {
      expect("title" in art).toBe(false);
      // Other fields still public
      expect(art["artist"]).toBeDefined();
    }
  });
});

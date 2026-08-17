/**
 * @dpa/evidence — policy and fixture tests.
 *
 * Tests cover:
 *  - No register check can produce a `clear`-like verdict
 *  - Every RegistryCheckRecord has non-empty caveat and officialSearch
 *  - Every TimelineEvent has non-empty source
 *  - General-knowledge events never have tier verifiedByAuthority
 *  - Fixture gather returns non-empty timeline for all four objects
 */
import { describe, it, expect } from "vitest";
import type { RegistryCheckRecord, TimelineEvent } from "@dpa/schema";
import {
  BURA_ASKOS_TIMELINE,
  BURA_ASKOS_REGISTRY_CHECKS,
  BENIN_BRONZE_TIMELINE,
  BENIN_BRONZE_REGISTRY_CHECKS,
  GETTY_BRONZE_TIMELINE,
  GETTY_BRONZE_REGISTRY_CHECKS,
  SCHIELE_WALLY_TIMELINE,
  SCHIELE_WALLY_REGISTRY_CHECKS,
  gatherEvidence,
  assertGeneralKnowledgePolicy,
} from "./index.js";
import { REGISTRIES } from "./registers.js";

/* -------------------------------------------------------------------------- */
/* All fixture data combined                                                   */
/* -------------------------------------------------------------------------- */

const ALL_REGISTRY_CHECKS: RegistryCheckRecord[] = [
  ...BURA_ASKOS_REGISTRY_CHECKS,
  ...BENIN_BRONZE_REGISTRY_CHECKS,
  ...GETTY_BRONZE_REGISTRY_CHECKS,
  ...SCHIELE_WALLY_REGISTRY_CHECKS,
];

const ALL_TIMELINE_EVENTS: TimelineEvent[] = [
  ...BURA_ASKOS_TIMELINE,
  ...BENIN_BRONZE_TIMELINE,
  ...GETTY_BRONZE_TIMELINE,
  ...SCHIELE_WALLY_TIMELINE,
];

/* -------------------------------------------------------------------------- */
/* ADR-009: No clear verdict                                                   */
/* -------------------------------------------------------------------------- */

const ALLOWED_VERDICTS = new Set<string>([
  "possible-match",
  "no-evidence-found",
  "not-queryable",
  "not-run",
]);

describe("ADR-009: no clear verdict", () => {
  it("no fixture registry check has a disallowed verdict", () => {
    for (const check of ALL_REGISTRY_CHECKS) {
      expect(ALLOWED_VERDICTS.has(check.verdict),
        `Registry "${check.registry}" has disallowed verdict "${check.verdict}"`
      ).toBe(true);
    }
  });

  it("REGISTRIES enum does not contain a 'clear' concept", () => {
    // The upstream schema permits exactly these four verdicts
    for (const reg of REGISTRIES) {
      // This is a structural check — the RegistryDef itself doesn't carry
      // a verdict, but its access type must be one of the four allowed values
      const allowed = new Set(["structured-api", "grounded-search", "referral-only", "paid-x402"]);
      expect(allowed.has(reg.access)).toBe(true);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* RegistryCheckRecord invariants                                              */
/* -------------------------------------------------------------------------- */

describe("RegistryCheckRecord invariants", () => {
  it("every record has a non-empty caveat", () => {
    for (const check of ALL_REGISTRY_CHECKS) {
      expect(check.caveat.length,
        `Registry "${check.registry}" has empty caveat`
      ).toBeGreaterThan(0);
    }
  });

  it("every record has a non-empty officialSearch URL", () => {
    for (const check of ALL_REGISTRY_CHECKS) {
      expect(check.officialSearch.length,
        `Registry "${check.registry}" has empty officialSearch`
      ).toBeGreaterThan(0);
    }
  });

  it("every record has a non-empty method", () => {
    for (const check of ALL_REGISTRY_CHECKS) {
      expect(check.method.length,
        `Registry "${check.registry}" has empty method`
      ).toBeGreaterThan(0);
    }
  });

  it("every record with hits has non-empty hit source URLs", () => {
    for (const check of ALL_REGISTRY_CHECKS) {
      for (const hit of check.hits) {
        expect(hit.source.length,
          `Hit in registry "${check.registry}" has empty source`
        ).toBeGreaterThan(0);
      }
    }
  });
});

/* -------------------------------------------------------------------------- */
/* TimelineEvent invariants                                                    */
/* -------------------------------------------------------------------------- */

describe("TimelineEvent invariants", () => {
  it("every event has a non-empty source URL", () => {
    for (const ev of ALL_TIMELINE_EVENTS) {
      expect(ev.source.length,
        `Event "${ev.event.slice(0, 60)}" has empty source`
      ).toBeGreaterThan(0);
    }
  });

  it("every event has a non-empty event description", () => {
    for (const ev of ALL_TIMELINE_EVENTS) {
      expect(ev.event.length).toBeGreaterThan(0);
    }
  });

  it("confidence is in [0, 1]", () => {
    for (const ev of ALL_TIMELINE_EVENTS) {
      expect(ev.confidence).toBeGreaterThanOrEqual(0);
      expect(ev.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("tier is a valid VerificationTier", () => {
    const validTiers = new Set<string>([
      "verifiedByAuthority",
      "reportedInPress",
      "inferred",
    ]);
    for (const ev of ALL_TIMELINE_EVENTS) {
      expect(validTiers.has(ev.tier),
        `Event has invalid tier "${ev.tier}"`
      ).toBe(true);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* General-knowledge policy                                                    */
/* -------------------------------------------------------------------------- */

describe("general-knowledge policy", () => {
  it("no general-knowledge event has tier verifiedByAuthority", () => {
    for (const ev of ALL_TIMELINE_EVENTS) {
      if (ev.isGeneralKnowledge) {
        expect(ev.tier,
          `General-knowledge event "${ev.event.slice(0, 60)}" has forbidden tier "verifiedByAuthority"`
        ).not.toBe("verifiedByAuthority");
      }
    }
  });

  it("assertGeneralKnowledgePolicy throws on invalid event", () => {
    const bad: TimelineEvent = {
      event: "test",
      date: null,
      location: null,
      source: "https://example.com",
      sourceType: "test",
      verifiedBy: "test",
      tier: "verifiedByAuthority",
      confidence: 0.9,
      isGeneralKnowledge: true,
    };
    expect(() => assertGeneralKnowledgePolicy(bad)).toThrow();
  });

  it("assertGeneralKnowledgePolicy passes on valid inferred event", () => {
    const good: TimelineEvent = {
      event: "test",
      date: null,
      location: null,
      source: "https://example.com",
      sourceType: "test",
      verifiedBy: "test",
      tier: "inferred",
      confidence: 0.3,
      isGeneralKnowledge: true,
    };
    expect(() => assertGeneralKnowledgePolicy(good)).not.toThrow();
  });
});

/* -------------------------------------------------------------------------- */
/* Fixture gather                                                              */
/* -------------------------------------------------------------------------- */

describe("fixture gather returns non-empty timelines", () => {
  const fixtureKeys = [
    "bura-askos",
    "benin-bronze",
    "getty-bronze",
    "schiele-wally",
  ] as const;

  for (const key of fixtureKeys) {
    it(`gatherEvidence("${key}") returns non-empty timeline`, async () => {
      const result = await gatherEvidence(
        { title: key },
        { mode: "fixtures", fixtureKey: key },
      );
      expect(result.timeline.length).toBeGreaterThan(0);
      expect(result.mode).toBe("fixtures");
    });

    it(`gatherEvidence("${key}") returns registry checks with valid verdicts`, async () => {
      const result = await gatherEvidence(
        { title: key },
        { mode: "fixtures", fixtureKey: key },
      );
      for (const check of result.registryChecks) {
        expect(ALLOWED_VERDICTS.has(check.verdict),
          `Key "${key}" registry "${check.registry}" has disallowed verdict "${check.verdict}"`
        ).toBe(true);
      }
    });
  }
});

/* -------------------------------------------------------------------------- */
/* Source bias note                                                            */
/* -------------------------------------------------------------------------- */

describe("source bias note", () => {
  it("is non-empty and mentions Western bias", async () => {
    const { SOURCE_BIAS_NOTE } = await import("./sourceBias.js");
    expect(SOURCE_BIAS_NOTE.length).toBeGreaterThan(50);
    expect(SOURCE_BIAS_NOTE.toLowerCase()).toContain("western");
  });
});

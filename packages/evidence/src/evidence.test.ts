/**
 * @dpa/evidence — service policy tests.
 *
 * These assert properties of the evidence SERVICE. Assertions about the
 * demo case data live with that data, in @dpa/fixtures-build, because this
 * package ships no case content.
 */
import { describe, it, expect } from "vitest";
import type { TimelineEvent } from "@dpa/schema";
import { gatherEvidence, assertGeneralKnowledgePolicy } from "./index.js";
import { REGISTRIES } from "./registers.js";

/* -------------------------------------------------------------------------- */
/* ADR-009: no clear verdict                                                   */
/* -------------------------------------------------------------------------- */

describe("ADR-009: register access types", () => {
  it("every register declares one of the four allowed access types", () => {
    const allowed = new Set([
      "structured-api",
      "grounded-search",
      "referral-only",
      "paid-x402",
    ]);
    for (const reg of REGISTRIES) {
      expect(allowed.has(reg.access), `Register "${reg.name}" has access "${reg.access}"`).toBe(true);
    }
  });

  it("every register states what it structurally cannot cover", () => {
    for (const reg of REGISTRIES) {
      expect(
        reg.coverage.length,
        `Register "${reg.name}" does not describe its own limits`,
      ).toBeGreaterThan(0);
    }
  });

  it("every register links an official search a human can redo", () => {
    for (const reg of REGISTRIES) {
      expect(reg.officialSearch.length, `Register "${reg.name}" has no official search URL`).toBeGreaterThan(0);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* General-knowledge policy (ADR-008)                                          */
/* -------------------------------------------------------------------------- */

describe("general-knowledge policy", () => {
  const base: TimelineEvent = {
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

  it("rejects a general-knowledge claim dressed as an authority record", () => {
    expect(() =>
      assertGeneralKnowledgePolicy({ ...base, tier: "verifiedByAuthority", confidence: 0.9 }),
    ).toThrow();
  });

  it("accepts a general-knowledge claim marked inferred", () => {
    expect(() => assertGeneralKnowledgePolicy(base)).not.toThrow();
  });
});

/* -------------------------------------------------------------------------- */
/* Recorded evidence injection                                                 */
/* -------------------------------------------------------------------------- */

describe("gatherEvidence with recorded evidence", () => {
  const recorded = {
    timeline: [
      {
        event: "Acquired by the museum",
        date: "1965",
        location: "London",
        source: "https://example.com/accession",
        sourceType: "museum-record",
        verifiedBy: "Example Museum",
        tier: "verifiedByAuthority" as const,
        confidence: 0.9,
        isGeneralKnowledge: false,
      },
    ],
    registryChecks: [],
  };

  it("returns the caller's recorded evidence without network I/O", async () => {
    const result = await gatherEvidence(
      { title: "Test Object" },
      { mode: "fixtures", recorded },
    );
    expect(result.timeline).toEqual(recorded.timeline);
    expect(result.mode).toBe("fixtures");
    expect(result.sourcesConsulted).toEqual(["recorded"]);
  });

  it("falls through to connectors when no recorded evidence is supplied", async () => {
    const result = await gatherEvidence(
      { title: "Test Object" },
      { mode: "fixtures", connectors: [] },
    );
    expect(result.sourcesConsulted).not.toContain("recorded");
  });
});

/* -------------------------------------------------------------------------- */
/* Source bias                                                                 */
/* -------------------------------------------------------------------------- */

describe("source bias note", () => {
  it("names the Western bias of the connector set rather than hiding it", async () => {
    const { SOURCE_BIAS_NOTE } = await import("./sourceBias.js");
    expect(SOURCE_BIAS_NOTE.length).toBeGreaterThan(50);
    expect(SOURCE_BIAS_NOTE.toLowerCase()).toContain("western");
  });
});

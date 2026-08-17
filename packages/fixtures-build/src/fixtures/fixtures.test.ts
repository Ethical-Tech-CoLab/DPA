/**
 * Data invariants for the committed case fixtures.
 *
 * These tests moved here from @dpa/evidence along with the data itself. They
 * assert properties of the DEMO CONTENT — that every claim carries a source,
 * that no register check reports a `clear`-like verdict, that no verdict
 * travels without its caveat. The evidence service tests its own behaviour
 * separately.
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
} from "./index.js";

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
/* ADR-009: no register check may report an object clear                       */
/* -------------------------------------------------------------------------- */

const ALLOWED_VERDICTS = new Set<string>([
  "possible-match",
  "no-evidence-found",
  "not-queryable",
  "not-run",
]);

describe("ADR-009: no clear verdict", () => {
  it("no fixture registry check reports a disallowed verdict", () => {
    for (const check of ALL_REGISTRY_CHECKS) {
      expect(
        ALLOWED_VERDICTS.has(check.verdict),
        `Registry "${check.registry}" has disallowed verdict "${check.verdict}"`,
      ).toBe(true);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* A verdict never travels without its caveat                                  */
/* -------------------------------------------------------------------------- */

describe("RegistryCheckRecord invariants", () => {
  it("every record carries a non-empty caveat", () => {
    for (const check of ALL_REGISTRY_CHECKS) {
      expect(check.caveat.length, `Registry "${check.registry}" has an empty caveat`).toBeGreaterThan(0);
    }
  });

  it("every record links the official search so a human can redo it", () => {
    for (const check of ALL_REGISTRY_CHECKS) {
      expect(
        check.officialSearch.length,
        `Registry "${check.registry}" has an empty officialSearch`,
      ).toBeGreaterThan(0);
    }
  });

  it("every record states the method used", () => {
    for (const check of ALL_REGISTRY_CHECKS) {
      expect(check.method.length, `Registry "${check.registry}" has an empty method`).toBeGreaterThan(0);
    }
  });

  it("every hit cites a source", () => {
    for (const check of ALL_REGISTRY_CHECKS) {
      for (const hit of check.hits) {
        expect(hit.source.length, `Hit in "${check.registry}" has an empty source`).toBeGreaterThan(0);
      }
    }
  });
});

/* -------------------------------------------------------------------------- */
/* ADR-008: no source, no claim                                                */
/* -------------------------------------------------------------------------- */

describe("TimelineEvent invariants", () => {
  it("every event cites a source", () => {
    for (const ev of ALL_TIMELINE_EVENTS) {
      expect(ev.source.length, `Event "${ev.event.slice(0, 60)}" has no source`).toBeGreaterThan(0);
    }
  });

  it("every event describes what happened", () => {
    for (const ev of ALL_TIMELINE_EVENTS) {
      expect(ev.event.length).toBeGreaterThan(0);
    }
  });

  it("confidence stays within [0, 1]", () => {
    for (const ev of ALL_TIMELINE_EVENTS) {
      expect(ev.confidence).toBeGreaterThanOrEqual(0);
      expect(ev.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("tier is a valid VerificationTier", () => {
    const validTiers = new Set<string>(["verifiedByAuthority", "reportedInPress", "inferred"]);
    for (const ev of ALL_TIMELINE_EVENTS) {
      expect(validTiers.has(ev.tier), `Event has invalid tier "${ev.tier}"`).toBe(true);
    }
  });

  it("no general-knowledge claim is presented as an authority record", () => {
    for (const ev of ALL_TIMELINE_EVENTS) {
      if (ev.isGeneralKnowledge) {
        expect(
          ev.tier,
          `General-knowledge event "${ev.event.slice(0, 60)}" claims verifiedByAuthority`,
        ).not.toBe("verifiedByAuthority");
      }
    }
  });
});

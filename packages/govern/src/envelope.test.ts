/**
 * Tests for envelope construction, validation, and disclosure explanation.
 */

import { describe, it, expect } from "vitest";
import { buildEnvelope, validateEnvelope, explainDisclosure } from "./index.js";
import { DEFAULT_FIELD_TIERS, ENVELOPE_VERSION, ALL_ROLES } from "@dpa/schema";

describe("buildEnvelope", () => {
  it("returns the default envelope when no overrides", () => {
    const env = buildEnvelope();
    expect(env.envelopeVersion).toBe(ENVELOPE_VERSION);
    expect(env.defaultTier).toBe("owner");
    expect(env.fieldTiers["artwork"]).toBe("public");
    expect(env.fieldTiers["holderIdentity"]).toBe("owner");
  });

  it("merges overrides key-by-key into fieldTiers", () => {
    const env = buildEnvelope({
      fieldTiers: { "artwork.title": "museum" as const },
    });
    expect(env.fieldTiers["artwork.title"]).toBe("museum");
    // Other defaults are preserved
    expect(env.fieldTiers["artwork.artist"]).toBe("public");
    expect(env.fieldTiers["holderIdentity"]).toBe("owner");
  });

  it("overrides defaultTier", () => {
    const env = buildEnvelope({ defaultTier: "public" });
    expect(env.defaultTier).toBe("public");
  });

  it("overrides envelopeVersion", () => {
    const env = buildEnvelope({ envelopeVersion: "custom-1.0" });
    expect(env.envelopeVersion).toBe("custom-1.0");
  });
});

describe("validateEnvelope", () => {
  it("validates the default envelope as valid with no errors", () => {
    const result = validateEnvelope(buildEnvelope());
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.warnings).toHaveLength(0);
  });

  it("returns error for invalid tier value", () => {
    const env = buildEnvelope({
      fieldTiers: {
        "artwork.title": "admin" as never,
      },
    });
    const result = validateEnvelope(env);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes("artwork.title"))).toBe(true);
    }
  });

  it("returns error for invalid defaultTier", () => {
    const env = {
      envelopeVersion: ENVELOPE_VERSION,
      defaultTier: "god" as never,
      fieldTiers: { ...DEFAULT_FIELD_TIERS },
    };
    const result = validateEnvelope(env);
    expect(result.valid).toBe(false);
  });

  it("warns about unknown paths", () => {
    const env = buildEnvelope({
      fieldTiers: { "some.unknown.path": "public" as const },
    });
    const result = validateEnvelope(env);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.warnings.some((w) => w.includes("some.unknown.path"))).toBe(true);
    }
  });
});

describe("explainDisclosure", () => {
  for (const role of ALL_ROLES) {
    it(`returns a non-empty string for role "${role}"`, () => {
      const explanation = explainDisclosure(role);
      expect(typeof explanation).toBe("string");
      expect(explanation.length).toBeGreaterThan(50);
    });
  }

  it("mentions what public sees and does NOT see", () => {
    const text = explainDisclosure("public");
    expect(text.toLowerCase()).toContain("public");
    expect(text).toContain("withheld");
  });

  it("mentions orthogonality for source-community", () => {
    const text = explainDisclosure("source-community");
    expect(text.toLowerCase()).toContain("source-community");
    expect(text).toContain("museum");
  });

  it("owner explanation mentions no withheld fields", () => {
    const text = explainDisclosure("owner");
    expect(text).toContain("none");
  });
});

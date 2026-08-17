/**
 * Tests for the boundary safety-net.
 */

import { describe, it, expect } from "vitest";
import { assertNoLeakage, LeakageError, redactForRole } from "./index.js";
import { ALL_ROLES } from "@dpa/schema";
import { makePassport } from "./testFixtures.js";
import type { RedactedPassport } from "@dpa/schema";
import { DEFAULT_FIELD_TIERS, ENVELOPE_VERSION } from "@dpa/schema";

describe("assertNoLeakage — passes cleanly for all roles", () => {
  const passport = makePassport();

  for (const role of ALL_ROLES) {
    it(`no leakage for role "${role}"`, () => {
      const redacted = redactForRole(passport, role);
      expect(() =>
        assertNoLeakage(redacted, role, passport.disclosure),
      ).not.toThrow();
    });
  }
});

describe("assertNoLeakage — throws LeakageError on planted leakage", () => {
  it("throws when holderIdentity is present for public role", () => {
    const passport = makePassport();
    const redacted = redactForRole(passport, "public");

    // Manually plant a leaked field
    const tampered = {
      ...redacted,
      holderIdentity: "Dr. Evil",
    } as RedactedPassport;

    expect(() =>
      assertNoLeakage(tampered, "public", passport.disclosure),
    ).toThrow(LeakageError);
  });

  it("LeakageError carries the offending path and tier", () => {
    const passport = makePassport();
    const redacted = redactForRole(passport, "public");

    const tampered = {
      ...redacted,
      holderPseudonym: "0xLeaked",
    } as RedactedPassport;

    let err: LeakageError | null = null;
    try {
      assertNoLeakage(tampered, "public", passport.disclosure);
    } catch (e) {
      if (e instanceof LeakageError) err = e;
    }

    expect(err).not.toBeNull();
    expect(err!.path).toBe("holderPseudonym");
    expect(err!.tier).toBe("enforcement");
    expect(err!.role).toBe("public");
  });

  it("throws when museum-tier field leaked to source-community", () => {
    const passport = makePassport();
    const redacted = redactForRole(passport, "source-community");

    const tampered = {
      ...redacted,
      condition: "Fine",
    } as RedactedPassport;

    expect(() =>
      assertNoLeakage(tampered, "source-community", passport.disclosure),
    ).toThrow(LeakageError);
  });

  it("throws when enforcement-tier field nested inside visible container is leaked", () => {
    const passport = makePassport();
    const redacted = redactForRole(passport, "public");

    // objectIdentity is partially visible; plant duplicateOf (enforcement tier)
    const tampered = {
      ...redacted,
      objectIdentity: {
        ...(redacted as Record<string, unknown>)["objectIdentity"] as Record<string, unknown>,
        duplicateOf: "some-other-passport",
      },
    } as RedactedPassport;

    expect(() =>
      assertNoLeakage(tampered, "public", passport.disclosure),
    ).toThrow(LeakageError);
  });
});

describe("assertNoLeakage — recognises synthetic count keys as valid", () => {
  it("provenanceTimelineCount is not flagged as leakage for public", () => {
    const passport = makePassport();
    const redacted = redactForRole(passport, "public");
    // provenanceTimelineCount was added by the redactor and should pass
    expect(() =>
      assertNoLeakage(redacted, "public", passport.disclosure),
    ).not.toThrow();
  });

  it("riskAssessment.flagsCount is not flagged as leakage for public", () => {
    const passport = makePassport();
    const redacted = redactForRole(passport, "public");
    expect(() =>
      assertNoLeakage(redacted, "public", passport.disclosure),
    ).not.toThrow();
  });
});

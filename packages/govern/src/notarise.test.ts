/**
 * Tests for notarisation (mock mode — no network, deterministic).
 */

import { describe, it, expect } from "vitest";
import {
  computeContentHash,
  notarisePassport,
  verifyNotarisation,
  HashMismatchError,
  BASE_SEPOLIA_CHAIN_ID,
} from "./index.js";
import { makePassport } from "./testFixtures.js";
import type { Passport } from "@dpa/schema";

// Build a passport whose contentHash is correct (matches computeContentHash).
function makeValidPassport(): Passport {
  const base = makePassport();
  const hash = computeContentHash(base as unknown as Record<string, unknown>);
  return { ...base, contentHash: hash };
}

describe("computeContentHash", () => {
  it("returns a 0x-prefixed 66-char hex string", () => {
    const passport = makeValidPassport();
    const hash = computeContentHash(passport as unknown as Record<string, unknown>);
    expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("is deterministic — same passport produces same hash", () => {
    const passport = makeValidPassport();
    expect(
      computeContentHash(passport as unknown as Record<string, unknown>),
    ).toBe(computeContentHash(passport as unknown as Record<string, unknown>));
  });

  it("changes when any non-hash field is mutated", () => {
    const passport = makeValidPassport();
    const mutated = {
      ...passport,
      artwork: { ...passport.artwork, title: "Different Title" },
    };
    expect(
      computeContentHash(mutated as unknown as Record<string, unknown>),
    ).not.toBe(computeContentHash(passport as unknown as Record<string, unknown>));
  });

  it("is unaffected by the contentHash field itself (self-referential independence)", () => {
    const passport = makeValidPassport();
    const withDifferentHash = {
      ...passport,
      contentHash: "0x" + "ab".repeat(32),
    };
    // Both should produce the same recomputed hash because contentHash is excluded
    expect(
      computeContentHash(withDifferentHash as unknown as Record<string, unknown>),
    ).toBe(computeContentHash(passport as unknown as Record<string, unknown>));
  });

  it("is unaffected by the signature field", () => {
    const passport = makeValidPassport();
    const withSig = { ...passport, signature: "0xdifferentsig" };
    expect(
      computeContentHash(withSig as unknown as Record<string, unknown>),
    ).toBe(computeContentHash(passport as unknown as Record<string, unknown>));
  });
});

describe("notarisePassport — mock mode", () => {
  it("returns a Notarisation with mode: mock", async () => {
    const passport = makeValidPassport();
    const result = await notarisePassport(passport);
    expect(result.notarisation.mode).toBe("mock");
  });

  it("returns chain base-sepolia and chainId 84532", async () => {
    const passport = makeValidPassport();
    const result = await notarisePassport(passport);
    expect(result.notarisation.chain).toBe("base-sepolia");
    expect(result.notarisation.chainId).toBe(BASE_SEPOLIA_CHAIN_ID);
  });

  it("returns a deterministic easUid", async () => {
    const passport = makeValidPassport();
    const r1 = await notarisePassport(passport);
    const r2 = await notarisePassport(passport);
    expect(r1.notarisation.easUid).toBe(r2.notarisation.easUid);
  });

  it("easUid is a 0x-prefixed hex string", async () => {
    const passport = makeValidPassport();
    const result = await notarisePassport(passport);
    expect(result.notarisation.easUid).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("throws HashMismatchError when passport.contentHash is wrong", async () => {
    const passport = makeValidPassport();
    const corrupted = {
      ...passport,
      contentHash: "0x" + "00".repeat(32),
    };
    await expect(
      notarisePassport(corrupted as Passport),
    ).rejects.toThrow(HashMismatchError);
  });
});

describe("verifyNotarisation", () => {
  it("returns valid:true for a freshly notarised passport", async () => {
    const base = makeValidPassport();
    const { notarisation } = await notarisePassport(base);
    const notarised = { ...base, notarisation };
    const result = verifyNotarisation(notarised);
    expect(result.valid).toBe(true);
  });

  it("returns valid:false when a content field is mutated after notarisation", async () => {
    const base = makeValidPassport();
    const { notarisation } = await notarisePassport(base);
    const notarised = { ...base, notarisation };

    // Mutate a field after notarisation
    const mutated = {
      ...notarised,
      artwork: { ...notarised.artwork, title: "Mutated Title" },
    };

    const result = verifyNotarisation(mutated as Passport);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain("contentHash mismatch");
    }
  });

  it("returns valid:false when notarisation is null", () => {
    const passport = makeValidPassport();
    const result = verifyNotarisation(passport); // notarisation is null in fixture
    expect(result.valid).toBe(false);
  });

  it("returns valid:false when mock easUid is tampered with", async () => {
    const base = makeValidPassport();
    const { notarisation } = await notarisePassport(base);
    const tampered = {
      ...base,
      notarisation: {
        ...notarisation,
        easUid: "0x" + "ff".repeat(32),
      },
    };

    const result = verifyNotarisation(tampered as Passport);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain("mock easUid");
    }
  });
});

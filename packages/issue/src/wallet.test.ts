import { describe, it, expect } from "vitest";
import { generateWalletIssuer, signAsWallet, verifyWalletSignature } from "./wallet.js";
import { contentHash } from "./canonicalise.js";
import { makeWalletPassport, buildPassportBody } from "./_testHelpers.js";

describe("wallet: round-trip", () => {
  it("generate → sign → verify passes", () => {
    const wi = generateWalletIssuer();
    const passport = makeWalletPassport(wi);
    const result = verifyWalletSignature(passport);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("tampered title field fails verification", () => {
    const wi = generateWalletIssuer();
    const passport = makeWalletPassport(wi);
    // Mutate a field after signing
    const tampered = { ...passport, artwork: { ...passport.artwork, title: "TAMPERED" } };
    // Recompute contentHash to match tampered payload (simulates a sophisticated tampering attempt)
    const result = verifyWalletSignature(tampered as typeof passport);
    // contentHash is stale relative to the tampered body → fails
    expect(result.valid).toBe(false);
  });

  it("tampered with recomputed contentHash still fails (signature mismatch)", () => {
    const wi = generateWalletIssuer();
    const passport = makeWalletPassport(wi);
    // Tamper AND update contentHash — signature still covers the original canonical form
    const tamperedBody = { ...passport, artwork: { ...passport.artwork, title: "TAMPERED" } };
    const { signature: _sig, ...bodyNoSig } = tamperedBody;
    const newHash = contentHash(bodyNoSig as Record<string, unknown>);
    const fullyTampered = { ...tamperedBody, contentHash: newHash };
    // Signature was computed over original, will not verify against new canonical form
    const result = verifyWalletSignature(fullyTampered as typeof passport);
    expect(result.valid).toBe(false);
  });

  it("wrong private key fails", () => {
    const wi = generateWalletIssuer();
    const wi2 = generateWalletIssuer();
    const body = buildPassportBody(wi.issuer);
    // Sign with wi's key but the passport issuer is wi's — sign with wi2's key
    const { signature: _sig, ...bodyNoSig } = { ...body, signature: "" };
    const signature = signAsWallet(body, wi2.privateKey);
    const passport = { ...body, signature };
    const result = verifyWalletSignature(passport as Parameters<typeof verifyWalletSignature>[0]);
    expect(result.valid).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import {
  createGovernanceRoot,
  issueFederatedRoot,
  issueCA,
  buildCAChain,
  verifyInstitutionSignature,
} from "./institution.js";
import { makeInstitutionPassport } from "./_testHelpers.js";

function buildTestChain() {
  const root = createGovernanceRoot("test-governance-root");
  const fed = issueFederatedRoot(root, "test-federated-root");
  const ca = issueCA(fed, "test-issuing-ca");
  const chain = buildCAChain(root, fed, ca);
  return { root, fed, ca, chain };
}

describe("institution: round-trip", () => {
  it("full chain verify passes", () => {
    const { chain } = buildTestChain();
    const passport = makeInstitutionPassport(chain);
    const result = verifyInstitutionSignature(passport);
    expect(result.valid).toBe(true);
    expect(result.checks.every((c: { passed: boolean }) => c.passed)).toBe(true);
  });

  it("tampered passport field fails", () => {
    const { chain } = buildTestChain();
    const passport = makeInstitutionPassport(chain);
    const tampered = { ...passport, artwork: { ...passport.artwork, title: "TAMPERED" } };
    const result = verifyInstitutionSignature(tampered as typeof passport);
    expect(result.valid).toBe(false);
  });

  it("broken chain link (swapped certs) fails", () => {
    const { chain } = buildTestChain();
    const { chain: chain2 } = buildTestChain(); // different root
    const passport = makeInstitutionPassport(chain);

    // Replace the root cert with one from a different chain
    const brokenChain = [
      passport.issuer.certificateChain![0]!,
      passport.issuer.certificateChain![1]!,
      JSON.stringify(chain2.root), // wrong root
    ];
    const broken = {
      ...passport,
      issuer: { ...passport.issuer, certificateChain: brokenChain },
    };
    const result = verifyInstitutionSignature(broken as typeof passport);
    expect(result.valid).toBe(false);
    // The federated-cert-signature check should fail
    const fedCheck = result.checks.find((c: { name: string; passed: boolean }) => c.name === "federated-cert-signature");
    expect(fedCheck?.passed).toBe(false);
  });

  it("revoked CA fails", () => {
    const { chain } = buildTestChain();
    const passport = makeInstitutionPassport(chain);
    // Pass the issuing CA fingerprint as revoked
    const revokedSet = new Set([chain.cert.fingerprint]);
    const result = verifyInstitutionSignature(passport, revokedSet);
    expect(result.valid).toBe(false);
    const revokeCheck = result.checks.find((c: { name: string; passed: boolean }) => c.name === "not-revoked");
    expect(revokeCheck?.passed).toBe(false);
  });

  it("revoked federated root fails", () => {
    const { chain, fed } = buildTestChain();
    const passport = makeInstitutionPassport(chain);
    const revokedSet = new Set([fed.cert.fingerprint]);
    const result = verifyInstitutionSignature(passport, revokedSet);
    expect(result.valid).toBe(false);
  });
});

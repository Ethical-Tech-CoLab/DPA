/**
 * Unified passport verifier — dispatches on issuer.issuerClass.
 *
 * PROVENANCE: derived from Ethical-Tech-CoLab/digital-passport-artworks
 *   (index.html, `async function verify()`) by @ChristineLumen.
 * See docs/DECISIONS.md#adr-004.
 *
 * Independently recomputes `contentHash` so that a tampered payload is
 * caught even if the signature somehow verifies against stale bytes.
 */

import type { Passport, IssuerClass } from "@dpa/schema";
import { verifyWalletSignature } from "./wallet.js";
import { verifyInstitutionSignature } from "./institution.js";

export interface VerifyCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface VerifyResult {
  valid: boolean;
  issuerClass: IssuerClass;
  checks: VerifyCheck[];
}

/**
 * Verify a passport, dispatching on `issuer.issuerClass`.
 *
 * For `pseudonymous-wallet`:
 *   - contentHash recomputed and compared
 *   - EIP-191 signature recovered, address compared to issuer.wallet
 *
 * For `accredited-institution`:
 *   - contentHash recomputed and compared
 *   - P-256 signature verified against issuing CA public key
 *   - Full chain walked: issuing CA → federated root → governance root
 *   - Revocation checked against `revokedFingerprints` if provided
 *
 * @param revokedFingerprints  For the institution class, fingerprints of any
 *   CA that should be treated as revoked. Ignored for the wallet class.
 */
export function verifyPassport(
  passport: Passport,
  revokedFingerprints?: ReadonlySet<string>,
): VerifyResult {
  const issuerClass = passport.issuer.issuerClass;

  if (issuerClass === "pseudonymous-wallet") {
    const r = verifyWalletSignature(passport);
    return {
      valid: r.valid,
      issuerClass,
      checks: [
        {
          name: "wallet-signature",
          passed: r.valid,
          detail: r.reason ?? `Valid — recovered address: ${r.recoveredAddress}`,
        },
      ],
    };
  }

  if (issuerClass === "accredited-institution") {
    const r = verifyInstitutionSignature(passport, revokedFingerprints);
    return { valid: r.valid, issuerClass, checks: r.checks };
  }

  // Should be unreachable with a valid Passport (Zod enum guards this).
  const _exhaustive: never = issuerClass;
  return {
    valid: false,
    issuerClass: _exhaustive,
    checks: [{ name: "issuerClass", passed: false, detail: `Unknown issuerClass: ${_exhaustive as string}` }],
  };
}

/**
 * Accredited-institution issuer class — ECDSA P-256, three-tier chain.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/digital-passport-artworks
 *   (index.html, `buildChainSilently` / `verify` / `signObj` / `verifyObj`)
 *   by @ChristineLumen. The upstream used Web Crypto (crypto.subtle); this
 *   port uses @noble/curves/nist (p256) so it runs in both Node and the
 *   browser without any browser-API polyfill.
 * See docs/DECISIONS.md#adr-004.
 *
 * ---------------------------------------------------------------------------
 * CERTIFICATE FORMAT
 *
 * Certificates are signed JSON objects — NOT hand-rolled X.509. The signed
 * body contains exactly four fields:
 *
 *   subject:   string   — identifier, e.g. "AABC-ICOM-UNESCO-root"
 *   issuer:    string   — parent's subject, or "self" for the governance root
 *   publicKey: string   — hex of uncompressed P-256 key (65 bytes = 130 hex)
 *   issuedAt:  string   — ISO 8601 date (YYYY-MM-DD)
 *
 * A DPACert extends the body with two derived fields (not covered by
 * the signature):
 *
 *   fingerprint: string — sha256 hex of the raw publicKey bytes
 *   signature:   string — hex of P-256 compact sig (r||s, 64 bytes = 128 hex)
 *                         over the body above (keys sorted, no extra fields)
 *
 * The fingerprint is a SHA-256 of the publicKey bytes — deterministic from
 * the body, included for convenience when checking revocation sets.
 *
 * The chain is stored in `issuer.certificateChain: string[]`, leaf first:
 *   [JSON(issuingCA), JSON(federatedRoot), JSON(governanceRoot)]
 *
 * Why not X.509?
 *   Implementing DER encoding for X.509 would add significant complexity
 *   for no protocol benefit inside a closed system. The JSON cert carries
 *   the same trust semantics (issuer signs subject's public key) in a form
 *   that is trivially inspectable and testable.
 * ---------------------------------------------------------------------------
 */

import { p256 } from "@noble/curves/nist";
import { sha256 } from "@noble/hashes/sha2";
import type { Passport, Issuer } from "@dpa/schema";
import { canonicalString } from "@dpa/schema";
import { bytesToHex, hexToBytes, contentHash } from "./canonicalise.js";

const _enc = new TextEncoder();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The signed body of a DPA certificate. */
export interface CertBody {
  subject: string;
  issuer: string;  // parent's subject, or "self"
  publicKey: string; // hex, uncompressed P-256 (65 bytes = 130 hex)
  issuedAt: string;  // YYYY-MM-DD
}

/**
 * A complete DPA certificate.
 * `fingerprint` and `signature` are NOT part of the signed body.
 */
export interface DPACert extends CertBody {
  /** sha256 hex of the raw public key bytes. */
  fingerprint: string;
  /** P-256 compact signature (r||s, 64 bytes = 128 hex) over the body. */
  signature: string;
}

/** A raw secp256r1 key pair. */
export interface KeyPair {
  privateKey: Uint8Array;
  /** Uncompressed public key: 0x04 ++ x(32) ++ y(32) = 65 bytes. */
  publicKey: Uint8Array;
}

/**
 * A fully-assembled CA chain ready to sign passports.
 * The three certs are stored in leaf-first order in the passport.
 */
export interface CAChain {
  /** Issuing CA — the leaf, signs passports directly. */
  cert: DPACert;
  /** The issuing CA's private key. */
  privateKey: Uint8Array;
  /** Federated root — signed by the governance root. */
  parent: DPACert;
  /** Governance root — self-signed. */
  root: DPACert;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function genKeyPair(): KeyPair {
  const privateKey = p256.utils.randomPrivateKey();
  const publicKey = p256.getPublicKey(privateKey, false); // uncompressed
  return { privateKey, publicKey };
}

function fingerprintOf(publicKeyHex: string): string {
  return bytesToHex(sha256(hexToBytes(publicKeyHex)));
}

/** Canonical JSON of a CertBody: only the four body fields, keys sorted. */
function certBodyJson(body: CertBody): Uint8Array {
  const sorted: Record<string, unknown> = {};
  for (const k of (Object.keys(body) as (keyof CertBody)[]).sort()) {
    sorted[k] = body[k];
  }
  return _enc.encode(JSON.stringify(sorted));
}

function signCertBody(body: CertBody, privKey: Uint8Array): string {
  const hash = sha256(certBodyJson(body));
  return p256.sign(hash, privKey).toCompactHex();
}

function verifyCertSignature(cert: DPACert, parentPublicKeyHex: string): boolean {
  try {
    const body: CertBody = {
      subject: cert.subject,
      issuer: cert.issuer,
      publicKey: cert.publicKey,
      issuedAt: cert.issuedAt,
    };
    const hash = sha256(certBodyJson(body));
    const sigBytes = hexToBytes(cert.signature);
    const pubKeyBytes = hexToBytes(parentPublicKeyHex);
    return p256.verify(sigBytes, hash, pubKeyBytes);
  } catch {
    return false;
  }
}

function buildCert(body: CertBody, signerPrivKey: Uint8Array): DPACert {
  return {
    ...body,
    fingerprint: fingerprintOf(body.publicKey),
    signature: signCertBody(body, signerPrivKey),
  };
}

// ---------------------------------------------------------------------------
// Public API — chain construction
// ---------------------------------------------------------------------------

/**
 * Create a self-signed governance root certificate.
 * This is the trust anchor for the entire institution issuer class.
 */
export function createGovernanceRoot(
  subject = "AABC-ICOM-UNESCO-root",
): { cert: DPACert; keyPair: KeyPair } {
  const kp = genKeyPair();
  const body: CertBody = {
    subject,
    issuer: "self",
    publicKey: bytesToHex(kp.publicKey),
    issuedAt: new Date().toISOString().slice(0, 10),
  };
  return { cert: buildCert(body, kp.privateKey), keyPair: kp };
}

/**
 * Issue a federated-root certificate, signed by the governance root.
 * Each federated root represents a national or regional authority
 * (e.g., Carabinieri TPC for Italy).
 */
export function issueFederatedRoot(
  parent: { cert: DPACert; keyPair: KeyPair },
  subject = "federated-root",
): { cert: DPACert; keyPair: KeyPair } {
  const kp = genKeyPair();
  const body: CertBody = {
    subject,
    issuer: parent.cert.subject,
    publicKey: bytesToHex(kp.publicKey),
    issuedAt: new Date().toISOString().slice(0, 10),
  };
  return { cert: buildCert(body, parent.keyPair.privateKey), keyPair: kp };
}

/**
 * Issue an issuing CA certificate, signed by a federated root.
 * Each issuing CA represents a single accredited institution
 * (e.g., a museum or registry body).
 */
export function issueCA(
  parent: { cert: DPACert; keyPair: KeyPair },
  subject = "issuing-ca",
): { cert: DPACert; keyPair: KeyPair } {
  const kp = genKeyPair();
  const body: CertBody = {
    subject,
    issuer: parent.cert.subject,
    publicKey: bytesToHex(kp.publicKey),
    issuedAt: new Date().toISOString().slice(0, 10),
  };
  return { cert: buildCert(body, parent.keyPair.privateKey), keyPair: kp };
}

/** Assemble a CAChain from the three cert+keypair objects. */
export function buildCAChain(
  root: { cert: DPACert; keyPair: KeyPair },
  fed: { cert: DPACert; keyPair: KeyPair },
  ca: { cert: DPACert; keyPair: KeyPair },
): CAChain {
  return {
    cert: ca.cert,
    privateKey: ca.keyPair.privateKey,
    parent: fed.cert,
    root: root.cert,
  };
}

/**
 * Build an `Issuer` from a CAChain.
 * certificateChain = [issuingCA, federatedRoot, governanceRoot] as JSON strings.
 */
export function caChainToIssuer(ca: CAChain, name: string): Issuer {
  return {
    name,
    issuerClass: "accredited-institution",
    id: ca.cert.subject,
    wallet: null,
    certificateChain: [
      JSON.stringify(ca.cert),
      JSON.stringify(ca.parent),
      JSON.stringify(ca.root),
    ],
  };
}

// ---------------------------------------------------------------------------
// Public API — signing & verification
// ---------------------------------------------------------------------------

/**
 * Sign a passport with the issuing CA's P-256 key.
 * Returns 128 lowercase hex chars (r||s compact, 64 bytes).
 */
export function signAsInstitution(
  passportBody: Omit<Passport, "signature">,
  ca: CAChain,
): string {
  const msg = _enc.encode(canonicalString(passportBody as Record<string, unknown>));
  const hash = sha256(msg);
  return p256.sign(hash, ca.privateKey).toCompactHex();
}

/**
 * Verify an institution passport signature, walking the full chain.
 *
 * Five checks, matching the upstream digital-passport-artworks verification:
 *   1. contentHash — payload has not been tampered since signing
 *   2. passport-signature — sig verifies against issuing CA public key
 *   3. ca-cert-signature — issuing CA cert signed by federated root
 *   4. federated-cert-signature — federated root cert signed by governance root
 *   5. root-self-signed — governance root self-signature is valid
 *   6. not-revoked — no cert fingerprint is in the revocation set
 *
 * @param revokedFingerprints  Optional set of cert fingerprints to treat as
 *   revoked. In production, populated from a live registry; in tests, a
 *   simple Set<string>. Passing `new Set([ca.cert.fingerprint])` simulates
 *   revoking the issuing CA.
 */
export function verifyInstitutionSignature(
  passport: Passport,
  revokedFingerprints?: ReadonlySet<string>,
): {
  valid: boolean;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
} {
  const checks: Array<{ name: string; passed: boolean; detail: string }> = [];

  // Parse the chain ----------------------------------------------------------
  const chain = passport.issuer.certificateChain;
  if (!chain || chain.length < 3) {
    return {
      valid: false,
      checks: [{ name: "chain-present", passed: false, detail: "certificateChain must have ≥ 3 entries (leaf, federated, root)" }],
    };
  }

  let caCert: DPACert, fedCert: DPACert, rootCert: DPACert;
  try {
    caCert   = JSON.parse(chain[0]!) as DPACert;
    fedCert  = JSON.parse(chain[1]!) as DPACert;
    rootCert = JSON.parse(chain[2]!) as DPACert;
  } catch (e) {
    return {
      valid: false,
      checks: [{ name: "chain-parse", passed: false, detail: `JSON parse error: ${(e as Error).message}` }],
    };
  }

  // 1. Content hash ----------------------------------------------------------
  const { signature, ...body } = passport;
  // contentHash() excludes both `signature` and `contentHash` itself.
  const expectedHash = contentHash(passport as Record<string, unknown>);
  const hashOk = passport.contentHash === expectedHash;
  checks.push({
    name: "content-hash",
    passed: hashOk,
    detail: hashOk
      ? "contentHash matches canonical payload"
      : `contentHash mismatch — payload tampered (stored: ${passport.contentHash}, computed: ${expectedHash})`,
  });

  // 2. Passport signature against issuing CA ---------------------------------
  const msgBytes = _enc.encode(canonicalString(body as Record<string, unknown>));
  const msgHash = sha256(msgBytes);
  let sigOk = false;
  try {
    sigOk = p256.verify(hexToBytes(signature), msgHash, hexToBytes(caCert.publicKey));
  } catch { sigOk = false; }
  checks.push({
    name: "passport-signature",
    passed: sigOk,
    detail: sigOk
      ? `Signature verifies against issuing CA: ${caCert.subject}`
      : `Signature does not verify against issuing CA (${caCert.subject})`,
  });

  // 3. Issuing CA cert signed by federated root ------------------------------
  const caByFed = verifyCertSignature(caCert, fedCert.publicKey);
  checks.push({
    name: "ca-cert-signature",
    passed: caByFed,
    detail: caByFed
      ? `Issuing CA cert (${caCert.subject}) signed by federated root (${fedCert.subject})`
      : `Issuing CA cert signature invalid — chain link broken`,
  });

  // 4. Federated root signed by governance root ------------------------------
  const fedByRoot = verifyCertSignature(fedCert, rootCert.publicKey);
  checks.push({
    name: "federated-cert-signature",
    passed: fedByRoot,
    detail: fedByRoot
      ? `Federated root cert (${fedCert.subject}) signed by governance root (${rootCert.subject})`
      : `Federated root cert signature invalid — chain link broken`,
  });

  // 5. Governance root is self-signed ----------------------------------------
  const rootSelf = verifyCertSignature(rootCert, rootCert.publicKey);
  checks.push({
    name: "root-self-signed",
    passed: rootSelf,
    detail: rootSelf
      ? `Governance root (${rootCert.subject}) self-signature valid`
      : `Governance root self-signature invalid`,
  });

  // 6. Revocation ------------------------------------------------------------
  const revoked = revokedFingerprints ?? new Set<string>();
  const caRev   = revoked.has(caCert.fingerprint);
  const fedRev  = revoked.has(fedCert.fingerprint);
  const rootRev = revoked.has(rootCert.fingerprint);
  const notRevoked = !caRev && !fedRev && !rootRev;
  checks.push({
    name: "not-revoked",
    passed: notRevoked,
    detail: notRevoked
      ? "No certificate in the chain is revoked"
      : [caRev && `issuing CA (${caCert.subject}) revoked`, fedRev && `federated root (${fedCert.subject}) revoked`, rootRev && `governance root (${rootCert.subject}) revoked`]
          .filter(Boolean)
          .join("; "),
  });

  return { valid: checks.every((c) => c.passed), checks };
}

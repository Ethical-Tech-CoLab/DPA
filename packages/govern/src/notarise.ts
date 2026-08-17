/**
 * EAS on-chain notarisation for DPA passports (Base Sepolia, ADR-006).
 *
 * ── What is attested ────────────────────────────────────────────────────────
 * ONLY the content hash is ever attested. No metadata, no images, no PII,
 * no provenance text — ever.
 *
 * Why: on-chain immutability is a feature for proof-of-registration-time and
 * a catastrophe for content. GDPR erasure, incorrect claims, and the DPA
 * disclosure model (which can redact at any time) are all incompatible with
 * permanent public content. The hash proves the record existed at a moment in
 * time and that it has not been altered; nothing more needs to be on-chain.
 *
 * ── Chain constants (Base Sepolia, chainId 84532) ────────────────────────────
 * EAS contract:            0x4200000000000000000000000000000000000021
 * SchemaRegistry contract: 0x4200000000000000000000000000000000000020
 * RPC:                     https://sepolia.base.org
 * Explorer:                https://base-sepolia.easscan.org
 *
 * ⚠️  IMPORTANT: The Ethereum-Sepolia EAS address 0xC2679fBD37d54388Ce493F1DB75320D236e1815e
 * is EMPTY on Base Sepolia — `eth_getCode` returns 0x. Do NOT reuse the
 * Ethereum-Sepolia constant on Base; the transaction will silently succeed
 * without creating an attestation. Always use the Base Sepolia address above.
 *
 * ── DPA Schema ──────────────────────────────────────────────────────────────
 * "bytes32 contentHash,string passportId,uint8 confidentialityLevel"
 * Register once with SchemaRegistry; persist the returned UID in DPA_SCHEMA_UID.
 *
 * ── Live mode ────────────────────────────────────────────────────────────────
 * Live attestation requires ethers and @ethereum-attestation-service/eas-sdk.
 * Neither is bundled with @dpa/govern (would burden browser bundles with >250 kB
 * for the common mock path). To enable:
 *   1. pnpm add ethers @ethereum-attestation-service/eas-sdk
 *   2. Set DPA_PRIVATE_KEY to a funded Base Sepolia wallet private key
 *   3. Set DPA_SCHEMA_UID to the registered schema UID
 *   4. Set DPA_MODE=live
 *   5. Implement liveNotarise using EAS.attest (see stub comment).
 * Until then, notarisePassport throws LiveModeError with clear instructions.
 *
 * ── Mock mode ────────────────────────────────────────────────────────────────
 * Default (DPA_MODE unset or any value other than "live"). The mock UID is
 * derived deterministically from the content hash via SHA-256. Nothing touches
 * the network. The resulting `Notarisation` has `mode: "mock"` so no consumer
 * can mistake it for a real attestation.
 *
 * PROVENANCE: ported from yorkerhodes3/dpa-prototype (lib/eas.ts).
 * See docs/DECISIONS.md#adr-006.
 */

import { sha256 } from "@noble/hashes/sha256";
import { canonicalString } from "@dpa/schema";
import type { Passport, Notarisation } from "@dpa/schema";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BASE_SEPOLIA_RPC = "https://sepolia.base.org";
export const BASE_SEPOLIA_CHAIN_ID = 84532 as const;

/** Base Sepolia EAS contract (NOT the same as Ethereum Sepolia — see module warning). */
export const EAS_CONTRACT = "0x4200000000000000000000000000000000000021";

/** Base Sepolia SchemaRegistry contract. */
export const SCHEMA_REGISTRY = "0x4200000000000000000000000000000000000020";

/** EAS explorer base URL. */
export const EAS_EXPLORER = "https://base-sepolia.easscan.org";

/**
 * Minimal DPA schema. Only the hash, the passport ID, and a coarse
 * confidentiality level. No content, no PII.
 */
export const DPA_SCHEMA_STRING =
  "bytes32 contentHash,string passportId,uint8 confidentialityLevel";

export function easScanUrl(uid: string): string {
  return `${EAS_EXPLORER}/attestation/view/${uid}`;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** Thrown when DPA_MODE=live but the required dependencies or keys are absent. */
export class LiveModeError extends Error {
  readonly code = "LIVE_MODE_NOT_CONFIGURED" as const;
  constructor(reason: string) {
    super(
      `DPA live-mode notarisation is not available: ${reason}. ` +
        "Install ethers and @ethereum-attestation-service/eas-sdk, " +
        "set DPA_PRIVATE_KEY and DPA_SCHEMA_UID, then implement liveNotarise.",
    );
    this.name = "LiveModeError";
  }
}

/** Thrown when a passport's contentHash does not match its recomputed value. */
export class HashMismatchError extends Error {
  readonly code = "HASH_MISMATCH" as const;
  constructor(stored: string, recomputed: string) {
    super(
      `Passport contentHash mismatch. Stored: ${stored}. Recomputed: ${recomputed}. ` +
        "The passport may have been mutated after signing.",
    );
    this.name = "HashMismatchError";
  }
}

// ---------------------------------------------------------------------------
// Content hash (browser + Node, no node:crypto, no Buffer)
// ---------------------------------------------------------------------------

/**
 * Compute the SHA-256 content hash of a passport's canonical form.
 *
 * Excludes three sealing fields from the input:
 *   `contentHash`  — cannot hash a value that includes itself
 *   `signature`    — excluded by `canonicalString`; made explicit here
 *   `notarisation` — references the hash (chicken-and-egg); set AFTER signing
 *
 * The result is `"0x"` + 64 lower-hex chars. Browser-compatible: TextEncoder
 * + @noble/hashes/sha256, no node:crypto, no Buffer.
 */
export function computeContentHash(passport: Record<string, unknown>): string {
  const { contentHash: _ch, signature: _sig, notarisation: _n, ...rest } = passport;
  const canonical = canonicalString(rest);
  const bytes = new TextEncoder().encode(canonical);
  const hash = sha256(bytes);
  return (
    "0x" +
    Array.from(hash)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

// ---------------------------------------------------------------------------
// Mock UID derivation (deterministic, never live)
// ---------------------------------------------------------------------------

/**
 * Derive a deterministic mock EAS UID from the content hash.
 * SHA-256(contentHash UTF-8 bytes) → "0x" + 64 hex chars.
 * Stable across runs: same passport → same UID every time.
 */
function mockUidFromContentHash(contentHash: string): string {
  const bytes = sha256(new TextEncoder().encode(contentHash));
  return (
    "0x" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

// ---------------------------------------------------------------------------
// Mode detection (works in both Node and browser)
// ---------------------------------------------------------------------------

function currentMode(): "live" | "mock" {
  try {
    if (typeof process !== "undefined" && process.env["DPA_MODE"] === "live") {
      return "live";
    }
  } catch {
    // browser: process is not defined
  }
  return "mock";
}

// ---------------------------------------------------------------------------
// Mock notarisation
// ---------------------------------------------------------------------------

function buildMockNotarisation(contentHash: string): Notarisation {
  return {
    chain: "base-sepolia",
    chainId: BASE_SEPOLIA_CHAIN_ID,
    easUid: mockUidFromContentHash(contentHash),
    txHash: null,
    attestedAt: null,
    mode: "mock",
    schemaUid: null,
  };
}

// ---------------------------------------------------------------------------
// Live notarisation stub
// ---------------------------------------------------------------------------

/**
 * Live-mode stub — throws LiveModeError rather than silently faking.
 *
 * To implement real attestation once deps are installed:
 *   const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
 *   const signer   = new ethers.Wallet(DPA_PRIVATE_KEY, provider);
 *   const eas      = new EAS(EAS_CONTRACT); eas.connect(signer);
 *   const encoder  = new SchemaEncoder(DPA_SCHEMA_STRING);
 *   const tx = await eas.attest({ schema: DPA_SCHEMA_UID, data: {
 *     recipient: ZeroAddress, expirationTime: NO_EXPIRATION, revocable: true,
 *     data: encoder.encodeData([contentHash, passportId, 0]) } });
 *   const uid = await tx.wait();
 */
async function liveNotarise(contentHash: string, passportId: string): Promise<Notarisation> {
  const hasKey =
    typeof process !== "undefined" &&
    typeof process.env["DPA_PRIVATE_KEY"] === "string" &&
    process.env["DPA_PRIVATE_KEY"].length > 0;

  if (!hasKey) {
    throw new LiveModeError("DPA_PRIVATE_KEY is not set");
  }

  const hasSchema =
    typeof process !== "undefined" &&
    typeof process.env["DPA_SCHEMA_UID"] === "string" &&
    process.env["DPA_SCHEMA_UID"].length > 0;

  if (!hasSchema) {
    throw new LiveModeError("DPA_SCHEMA_UID is not set");
  }

  // ethers and @ethereum-attestation-service/eas-sdk are not installed in this
  // package. Throw clearly instead of silently faking a real attestation.
  // Install the deps, implement liveNotarise as documented in the jsdoc above.
  throw new LiveModeError(
    `ethers and @ethereum-attestation-service/eas-sdk are not installed. ` +
      `[contentHash=${contentHash} passportId=${passportId}]`,
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type NotariseResult = {
  notarisation: Notarisation;
  /** The content hash that was attested. */
  contentHash: string;
};

/**
 * Notarise a passport on Base Sepolia (EAS).
 *
 * Verifies that `passport.contentHash` matches the recomputed hash before
 * submitting. In mock mode (default) this is instant and deterministic. In
 * live mode this would send a real Ethereum transaction (see liveNotarise stub).
 */
export async function notarisePassport(passport: Passport): Promise<NotariseResult> {
  const recomputed = computeContentHash(passport as unknown as Record<string, unknown>);

  if (passport.contentHash !== recomputed) {
    throw new HashMismatchError(passport.contentHash, recomputed);
  }

  const mode = currentMode();
  const notarisation =
    mode === "live"
      ? await liveNotarise(recomputed, passport.id)
      : buildMockNotarisation(recomputed);

  return { notarisation, contentHash: recomputed };
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export type VerifyResult = { valid: true } | { valid: false; reason: string };

/**
 * Verify a notarised passport.
 *
 * Recomputes the content hash and checks it matches the stored `contentHash`.
 * For mock passports, additionally verifies that the easUid is the expected
 * deterministic derivation so nothing can substitute a real UID for a mock.
 *
 * A mismatch means the passport was mutated after attestation.
 */
export function verifyNotarisation(passport: Passport): VerifyResult {
  const recomputed = computeContentHash(passport as unknown as Record<string, unknown>);

  if (recomputed !== passport.contentHash) {
    return {
      valid: false,
      reason:
        `contentHash mismatch — passport was mutated after attestation. ` +
        `Stored: ${passport.contentHash}. Recomputed: ${recomputed}.`,
    };
  }

  const n = passport.notarisation;
  if (!n) {
    return { valid: false, reason: "no notarisation record on passport" };
  }

  // For mock notarisations, verify the UID is the expected deterministic value.
  if (n.mode === "mock" && n.easUid !== null) {
    const expected = mockUidFromContentHash(recomputed);
    if (n.easUid !== expected) {
      return {
        valid: false,
        reason:
          `mock easUid does not match expected derivation from contentHash. ` +
          `Expected: ${expected}. Found: ${n.easUid}.`,
      };
    }
  }

  return { valid: true };
}

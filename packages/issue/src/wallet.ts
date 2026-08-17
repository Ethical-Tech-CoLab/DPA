/**
 * Pseudonymous-wallet issuer class — secp256k1 / EIP-191 / did:pkh.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/arts-provenance-agent
 *   (src/lib/signing.ts, src/wallet/wallet.ts) by @ChristineLumen.
 *   Upstream used viem; this port uses @noble/curves/secp256k1 so the
 *   module runs in both Node and the browser without native bindings.
 * See docs/DECISIONS.md#adr-004.
 *
 * ---------------------------------------------------------------------------
 * WHY TWO ISSUER CLASSES MUST COEXIST IN ONE ENVELOPE (ADR-004)
 *
 * These are not competing trust models — they are the two complementary
 * halves of the programme requirement:
 *
 *   Requiring ONLY institutional accreditation destroys the pseudonymity
 *   the programme depends on. A holder who must be named will not register.
 *   Sensitive provenance goes unrecorded and the object's history is lost.
 *
 *   Requiring ONLY a self-signed wallet destroys institutional trust. A
 *   museum cannot rely on an anonymous assertion when making a lending or
 *   acquisition decision.
 *
 * Both must coexist in one registry. The `issuerClass` field and the
 * `signature` field together let any verifier know which trust path to walk,
 * while the canonical payload and contentHash remain identical for both —
 * meaning a notarised hash carries the same meaning regardless of issuer.
 * ---------------------------------------------------------------------------
 */

import { secp256k1 } from "@noble/curves/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";
import { sha256 } from "@noble/hashes/sha256";
import type { Passport, Issuer } from "@dpa/schema";
import { canonicalString, signableString } from "@dpa/schema";
import { bytesToHex, hexToBytes, contentHash } from "./canonicalise.js";

export const BASE_SEPOLIA_CHAIN_ID = 84532;

const _enc = new TextEncoder();

// ---------------------------------------------------------------------------
// EIP-191 personal_sign helpers
// ---------------------------------------------------------------------------

/** Build the EIP-191 prefixed message bytes. */
function eip191Bytes(message: Uint8Array): Uint8Array {
  const prefix = _enc.encode(`\x19Ethereum Signed Message:\n${message.length}`);
  const out = new Uint8Array(prefix.length + message.length);
  out.set(prefix, 0);
  out.set(message, prefix.length);
  return out;
}

/** keccak256 of the EIP-191 prefixed message. */
function eip191Hash(message: Uint8Array): Uint8Array {
  return keccak_256(eip191Bytes(message));
}

// ---------------------------------------------------------------------------
// Address derivation
// ---------------------------------------------------------------------------

/**
 * Derive the Ethereum address from a secp256k1 private key.
 * Algorithm: keccak256(uncompressed_pubkey[1:]), take last 20 bytes.
 * Returns lower-case hex without checksum; call `checksumAddress` to upgrade.
 */
export function privateKeyToAddress(privKey: Uint8Array): string {
  // secp256k1.getPublicKey(key, false) → uncompressed: 0x04 ++ x(32) ++ y(32)
  const uncompressed = secp256k1.getPublicKey(privKey, false);
  const hash = keccak_256(uncompressed.slice(1)); // 64 bytes → 32 bytes
  return bytesToHex(hash.slice(12)).toLowerCase(); // last 20 bytes
}

/**
 * EIP-55 checksum encoding. Pure function, no external deps.
 * Returns `0x` + mixed-case address.
 */
export function checksumAddress(addrHexNoPrefix: string): string {
  const lower = addrHexNoPrefix.replace(/^0x/i, "").toLowerCase();
  const hash = bytesToHex(keccak_256(_enc.encode(lower)));
  let out = "0x";
  for (let i = 0; i < lower.length; i++) {
    const c = lower[i]!;
    out += parseInt(hash[i]!, 16) >= 8 ? c.toUpperCase() : c;
  }
  return out;
}

/** Format a did:pkh for Base Sepolia. */
export function didPkh(address: string): string {
  return `did:pkh:eip155:${BASE_SEPOLIA_CHAIN_ID}:${address}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface WalletIssuer {
  issuer: Issuer;
  /** Raw 32-byte secp256k1 private key. Guard this carefully. */
  privateKey: Uint8Array;
}

/** Build a wallet issuer from an existing 32-byte secp256k1 private key. */
export function walletIssuerFromKey(
  privKey: Uint8Array,
  name = "Pseudonymous wallet issuer",
): WalletIssuer {
  const address = checksumAddress(privateKeyToAddress(privKey));
  const issuer: Issuer = {
    name,
    issuerClass: "pseudonymous-wallet",
    id: didPkh(address),
    wallet: address,
    certificateChain: null,
  };
  return { issuer, privateKey: privKey };
}

/**
 * Derive a wallet issuer deterministically from a text seed.
 *
 * For demos, tests, and build-time fixture generation, where a fresh random
 * key on every run would make the output churn and hide real diffs behind
 * noise. NEVER use this for a key that signs anything of consequence: the
 * seed is the key, so anyone who reads the seed holds the key.
 */
export function deterministicWalletIssuer(
  seed: string,
  name = "Pseudonymous wallet issuer",
): WalletIssuer {
  const privKey = sha256(_enc.encode(`dpa-v0.4-demo-issuer:${seed}`));
  return walletIssuerFromKey(privKey, name);
}

/** Generate a fresh pseudonymous-wallet issuer. */
export function generateWalletIssuer(name = "Pseudonymous wallet issuer"): WalletIssuer {
  const privKey = secp256k1.utils.randomPrivateKey();
  return walletIssuerFromKey(privKey, name);
}

/**
 * Sign a passport with a secp256k1 wallet key (EIP-191 personal_sign).
 *
 * Returns 130 lowercase hex chars: r (64) ++ s (64) ++ recovery (2).
 * Recovery is 0 or 1 (not the Ethereum +27 convention) — kept raw for
 * portability; add 27 when interoperating with Ethereum tooling.
 */
export function signAsWallet(
  passportBody: Omit<Passport, "signature">,
  privKey: Uint8Array,
): string {
  const msg = _enc.encode(signableString(passportBody as Record<string, unknown>));
  const hash = eip191Hash(msg);
  const sig = secp256k1.sign(hash, privKey);
  return sig.toCompactHex() + sig.recovery!.toString(16).padStart(2, "0");
}

/**
 * Verify an EIP-191 wallet signature and compare the recovered address to
 * `passport.issuer.wallet`. Also independently recomputes the contentHash.
 */
export function verifyWalletSignature(passport: Passport): {
  valid: boolean;
  recoveredAddress: string;
  reason?: string;
} {
  try {
    const { signature, ...body } = passport;

    // Tamper check: contentHash must match the canonical payload
    // (contentHash() excludes both `signature` and `contentHash` itself).
    const expectedHash = contentHash(passport as Record<string, unknown>);
    if (passport.contentHash !== expectedHash) {
      return {
        valid: false,
        recoveredAddress: "",
        reason: `Content hash mismatch — payload tampered (stored: ${passport.contentHash}, computed: ${expectedHash})`,
      };
    }

    if (!signature || signature.length !== 130) {
      return {
        valid: false,
        recoveredAddress: "",
        reason: `Malformed signature: expected 130 hex chars, got ${signature?.length ?? 0}`,
      };
    }

    const compact = hexToBytes(signature.slice(0, 128));
    const recovery = parseInt(signature.slice(128), 16);
    if (recovery !== 0 && recovery !== 1) {
      return { valid: false, recoveredAddress: "", reason: `Bad recovery bit: ${recovery}` };
    }

    const msg = _enc.encode(signableString(body as Record<string, unknown>));
    const hash = eip191Hash(msg);

    const sig = secp256k1.Signature.fromCompact(compact).addRecoveryBit(recovery);
    const pubKey = sig.recoverPublicKey(hash);
    const uncompressed = pubKey.toRawBytes(false); // 65 bytes
    const addrHash = keccak_256(uncompressed.slice(1));
    const recovered = checksumAddress(bytesToHex(addrHash.slice(12)));

    const expected = passport.issuer.wallet;
    const valid = expected !== null && recovered.toLowerCase() === expected.toLowerCase();

    return {
      valid,
      recoveredAddress: recovered,
      reason: valid ? undefined : `Recovered ${recovered} ≠ issuer.wallet ${expected}`,
    };
  } catch (e) {
    return { valid: false, recoveredAddress: "", reason: (e as Error).message };
  }
}

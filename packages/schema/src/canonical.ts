/**
 * Canonicalisation — the exact bytes both issuer classes sign over.
 *
 * There is one canonicalisation for the whole system. If the wallet class and
 * the institution class canonicalised differently, a passport would have two
 * content hashes and the notarised hash would verify only one of them.
 *
 * Rules: recursively sort object keys, preserve array order, drop `undefined`,
 * exclude the `signature` field, and serialise with no insignificant
 * whitespace. This is JCS-like (RFC 8785) without pulling in a dependency;
 * it is deliberately simple enough to reimplement in another language.
 */

import { keccak_256 } from "@noble/hashes/sha3";

export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

function sortValue(v: unknown): Json {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) return v.map(sortValue);
  if (typeof v === "object") {
    const out: Record<string, Json> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort()) {
      const val = (v as Record<string, unknown>)[k];
      if (val === undefined) continue;
      out[k] = sortValue(val);
    }
    return out;
  }
  if (typeof v === "number" && !Number.isFinite(v)) {
    throw new Error("Cannot canonicalise a non-finite number");
  }
  return v as Json;
}

/** The signable form: everything except `signature`, key-sorted. */
export function canonicalPayload<T extends Record<string, unknown>>(passport: T): Json {
  const { signature: _drop, ...rest } = passport as Record<string, unknown>;
  return sortValue(rest);
}

/** The exact UTF-8 string that gets hashed. */
export function canonicalString<T extends Record<string, unknown>>(passport: T): string {
  return JSON.stringify(canonicalPayload(passport));
}

/* -------------------------------------------------------------------------- */
/* The content hash                                                            */
/* -------------------------------------------------------------------------- */

/**
 * THE content hash. There is exactly one, and it lives here.
 *
 * It sits in @dpa/schema rather than in the packages that use it because both
 * @dpa/issue (which signs over it) and @dpa/govern (which notarises it) need
 * the identical value, and during the v0.4 build each package grew its own
 * implementation — one keccak256 without a prefix, one SHA-256 with one. They
 * disagreed on every axis, so a passport signed by one could not be verified
 * by the other. Two canonicalisations mean two possible hashes for one payload,
 * which silently breaks notarisation: the chain would attest to a value no
 * verifier could reproduce.
 *
 * Defining it once, in the package both depend on, makes a divergent second
 * implementation awkward to write rather than merely discouraged.
 *
 * Three sealing fields are excluded:
 *   `contentHash`  — a value cannot contain its own hash
 *   `signature`    — dropped by canonicalString; restated here for clarity
 *   `notarisation` — written AFTER signing and references this hash, so
 *                    including it would make every notarised passport fail
 *                    verification
 *
 * keccak256 is used because notarisation targets an EVM chain, where this is
 * the native digest. Returns `0x` + 64 lowercase hex characters.
 */
export function contentHash(passport: Record<string, unknown>): string {
  const {
    contentHash: _hash,
    signature: _sig,
    notarisation: _notarisation,
    ...rest
  } = passport;
  const bytes = new TextEncoder().encode(canonicalString(rest));
  const digest = keccak_256(bytes);
  let hex = "";
  for (let i = 0; i < digest.length; i++) {
    hex += (digest[i]! & 0xff).toString(16).padStart(2, "0");
  }
  return "0x" + hex;
}

/**
 * The exact bytes an issuer signs.
 *
 * Identical to the input of `contentHash`: everything except `signature`,
 * `contentHash` and `notarisation`.
 *
 * `notarisation` must be excluded for the same reason it is excluded from the
 * hash, and the reason is ordering. ADR-006 attests to a passport AFTER it is
 * signed, because the attestation commits to the content hash. If the
 * signature covered `notarisation`, then writing the attestation back into the
 * record would invalidate the very signature that made it worth attesting to —
 * every notarised passport in the system would fail verification, and only
 * un-notarised ones would pass.
 */
export function signableString(passport: Record<string, unknown>): string {
  const {
    signature: _sig,
    contentHash: _hash,
    notarisation: _notarisation,
    ...rest
  } = passport;
  return canonicalString(rest);
}

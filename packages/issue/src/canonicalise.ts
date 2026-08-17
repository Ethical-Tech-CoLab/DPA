/**
 * Canonicalisation — thin re-export over @dpa/schema's canonical module,
 * plus a keccak256 content hash shared by both issuer classes.
 *
 * ONE canonicalisation for the whole system. Wallet and institution classes
 * sign the same byte sequence, so the notarised hash verifies regardless of
 * which class issued the passport. A second canonicalisation would produce
 * two possible content hashes for the same payload, breaking notarisation.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/digital-passport-artworks
 *   (index.html, in-browser chain: `function canon(obj){ ... }`) by
 *   @ChristineLumen. The upstream used `JSON.stringify(obj,
 *   Object.keys(obj).sort())`, which is insertion-order-dependent for nested
 *   objects. @dpa/schema's `canonicalString` does a proper recursive key sort
 *   (JCS-like, RFC 8785 without the dependency).
 * See docs/DECISIONS.md#adr-004.
 */

export { canonicalString, canonicalPayload } from "@dpa/schema";

/** Encode a Uint8Array as a lowercase hex string. No Buffer. */
export function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += (bytes[i]! & 0xff).toString(16).padStart(2, "0");
  }
  return out;
}

/** Decode a lowercase/uppercase hex string to a Uint8Array. No Buffer. */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error(`hexToBytes: odd-length hex string (${hex.length})`);
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    out[i >> 1] = parseInt(hex.slice(i, i + 2), 16);
  }
  return out;
}

const _enc = new TextEncoder();

/**
 * keccak256 of the canonical payload.
 *
 * Re-exported from @dpa/schema so that the wallet class, the institution
 * class, and the notarisation path all hash identical bytes. This module used
 * to compute its own; see the note on `contentHash` in @dpa/schema for why
 * that had to stop.
 */
export { contentHash } from "@dpa/schema";

/**
 * StatusList2021 revocation — a compact bitstring for passport revocation.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/digital-passport-artworks
 *   (index.html, `rebuildRevocationList` / revocation toggle logic)
 *   by @ChristineLumen. The upstream signed a per-passport revocation entry;
 *   this generalises it to a StatusList2021-style bitstring so a single
 *   signed credential covers the whole issuing CA's revocation set.
 * See docs/DECISIONS.md (ADR-004, ADR-006).
 *
 * ---------------------------------------------------------------------------
 * ENCODING
 *
 * The bitstring is a byte-packed array: bit `i` lives at
 *   byte  = floor(i / 8)
 *   shift = i % 8    (LSB = bit 0)
 *
 * The packed bytes are encoded as base64url WITHOUT padding. This is simpler
 * than the StatusList2021 spec's GZIP+base64url approach and avoids any
 * dependency on `zlib` (which is not available in the browser bundle).
 * A production implementation should add GZIP before the base64url step;
 * the encode/decode API is structured so that upgrade is a one-line change.
 *
 * Maximum size: 131,072 entries (16 KB of packed bits) is the recommended
 * StatusList2021 minimum. For prototype scale this is more than enough.
 * ---------------------------------------------------------------------------
 */

import type { CredentialStatus } from "@dpa/schema";

const DEFAULT_SIZE = 131_072; // StatusList2021 recommended minimum

// ---------------------------------------------------------------------------
// base64url helpers (no Buffer, no atob/btoa dependency on specific encoding)
// ---------------------------------------------------------------------------

const BASE64URL_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function bytesToBase64url(bytes: Uint8Array): string {
  let out = "";
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const b0 = bytes[i]!;
    const b1 = bytes[i + 1]!;
    const b2 = bytes[i + 2]!;
    out +=
      BASE64URL_CHARS[b0 >> 2]! +
      BASE64URL_CHARS[((b0 & 3) << 4) | (b1 >> 4)]! +
      BASE64URL_CHARS[((b1 & 0xf) << 2) | (b2 >> 6)]! +
      BASE64URL_CHARS[b2 & 0x3f]!;
  }
  if (i + 1 === bytes.length) {
    const b0 = bytes[i]!;
    out +=
      BASE64URL_CHARS[b0 >> 2]! +
      BASE64URL_CHARS[(b0 & 3) << 4]!;
    // No padding in base64url
  } else if (i + 2 === bytes.length) {
    const b0 = bytes[i]!;
    const b1 = bytes[i + 1]!;
    out +=
      BASE64URL_CHARS[b0 >> 2]! +
      BASE64URL_CHARS[((b0 & 3) << 4) | (b1 >> 4)]! +
      BASE64URL_CHARS[(b1 & 0xf) << 2]!;
  }
  return out;
}

function base64urlToBytes(s: string): Uint8Array {
  const lookup: Record<string, number> = {};
  for (let i = 0; i < BASE64URL_CHARS.length; i++) lookup[BASE64URL_CHARS[i]!] = i;
  // Add padding for decoding calculation
  const pad = s.length % 4;
  const padded = pad ? s + "=".repeat(4 - pad) : s;
  const byteLen = Math.floor((padded.length * 3) / 4) - (padded.endsWith("==") ? 2 : padded.endsWith("=") ? 1 : 0);
  const out = new Uint8Array(byteLen);
  let o = 0;
  for (let i = 0; i < s.length; ) {
    const c0 = lookup[s[i++]!] ?? 0;
    const c1 = lookup[s[i++]!] ?? 0;
    const c2 = i <= s.length ? (lookup[s[i++]!] ?? 0) : 0;
    const c3 = i <= s.length ? (lookup[s[i++]!] ?? 0) : 0;
    if (o < byteLen) out[o++] = (c0 << 2) | (c1 >> 4);
    if (o < byteLen) out[o++] = ((c1 & 0xf) << 4) | (c2 >> 2);
    if (o < byteLen) out[o++] = ((c2 & 3) << 6) | c3;
  }
  return out;
}

// ---------------------------------------------------------------------------
// StatusList class
// ---------------------------------------------------------------------------

export class StatusList {
  private bits: Uint8Array;
  private _nextIndex: number;

  constructor(size = DEFAULT_SIZE) {
    this.bits = new Uint8Array(Math.ceil(size / 8));
    this._nextIndex = 0;
  }

  /** Allocate the next available index. Every passport allocates one at issuance. */
  allocateIndex(): number {
    const maxBits = this.bits.length * 8;
    if (this._nextIndex >= maxBits) {
      throw new Error(`StatusList exhausted (capacity: ${maxBits})`);
    }
    return this._nextIndex++;
  }

  /** Current highest allocated index (exclusive). */
  get size(): number {
    return this._nextIndex;
  }

  private checkIndex(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.bits.length * 8) {
      throw new RangeError(`StatusList index out of range: ${index}`);
    }
  }

  revoke(index: number): void {
    this.checkIndex(index);
    this.bits[index >> 3]! |= 1 << (index & 7);
  }

  reinstate(index: number): void {
    this.checkIndex(index);
    this.bits[index >> 3]! &= ~(1 << (index & 7));
  }

  isRevoked(index: number): boolean {
    this.checkIndex(index);
    return ((this.bits[index >> 3]! >> (index & 7)) & 1) === 1;
  }

  /**
   * Encode the bitstring as base64url (no padding).
   * Stores only the bytes needed for allocated indices.
   */
  encode(): string {
    const usedBytes = this._nextIndex > 0 ? Math.ceil(this._nextIndex / 8) : 0;
    return bytesToBase64url(this.bits.slice(0, usedBytes));
  }

  /**
   * Decode a base64url-encoded bitstring back into a StatusList.
   * `nextIndex` is the number of allocated entries (must be provided separately).
   */
  static decode(encoded: string, nextIndex: number): StatusList {
    const bytes = base64urlToBytes(encoded);
    const sl = new StatusList(Math.max(bytes.length * 8, DEFAULT_SIZE));
    sl.bits.set(bytes);
    sl._nextIndex = nextIndex;
    return sl;
  }

  /**
   * Build the `CredentialStatus` entry for a specific passport.
   * The `statusListCredential` URL must be provided by the caller (e.g., the
   * issuer's public endpoint for this list).
   */
  buildStatusListCredential(index: number, statusListCredentialUrl: string): CredentialStatus {
    return {
      type: "StatusList2021Entry",
      statusPurpose: "revocation",
      statusListIndex: index,
      statusListCredential: statusListCredentialUrl,
    };
  }
}

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

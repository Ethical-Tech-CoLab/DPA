/**
 * Passport redaction — the confidentiality envelope.
 *
 * A withheld field is ABSENT from the returned object — not null, not
 * "[redacted]", not an empty string. Deletion is the only form of redaction
 * that survives serialisation to a static file.
 *
 * Resolution precedence (most specific wins):
 *   `artwork.dimensions` beats `artwork` beats `defaultTier`
 *
 * PROVENANCE: ported from yorkerhodes3/dpa-prototype (lib/dpa.ts).
 * See docs/DECISIONS.md#adr-005.
 */

import {
  canSee,
  visibleTiers,
  COUNT_ONLY_PUBLIC,
} from "@dpa/schema";
import type {
  Role,
  DisclosureTier,
  DisclosureEnvelope,
  Passport,
  RedactedPassport,
} from "@dpa/schema";

/**
 * contentHash and signature always survive redaction regardless of the
 * envelope tier assigned to them. A public reader must be able to confirm
 * the record is notarised even when they cannot read its content.
 *
 * Deliberate trade-off: the hash proves existence without revealing content.
 * The signature proves integrity. Withholding either would break the
 * proof-of-registration guarantee that is the programme's core bargain.
 */
const ALWAYS_PUBLIC = new Set<string>(["contentHash", "signature"]);

/**
 * Resolve the disclosure tier for a dot-path by walking from the most
 * specific path to the least specific, then falling back to `defaultTier`.
 *
 *   resolveTier("artwork.dimensions", env) → "museum"   (specific match)
 *   resolveTier("artwork.title",      env) → "public"   (specific match)
 *   resolveTier("artwork.foo",        env) → "public"   (falls to "artwork")
 *   resolveTier("unknown.deep.path",  env) → defaultTier
 */
export function resolveTier(path: string, envelope: DisclosureEnvelope): DisclosureTier {
  const parts = path.split(".");
  for (let len = parts.length; len > 0; len--) {
    const candidate = parts.slice(0, len).join(".");
    const tier = envelope.fieldTiers[candidate];
    if (tier !== undefined) return tier;
  }
  return envelope.defaultTier;
}

// ---------------------------------------------------------------------------
// Internal recursive walk
// ---------------------------------------------------------------------------

/**
 * Walk a plain-object node, deciding field-by-field what to keep.
 *
 * Objects are always recursed into; a nested object appears in the output
 * only when the recursion produces at least one visible child. This lets
 * `objectIdentity.sha256: "public"` shine through even though
 * `objectIdentity: "museum"` would otherwise hide the whole block.
 *
 * Arrays are treated as atomic at the path of the array key itself. Each
 * element is recursed into so field-level overrides inside the element still
 * work, but the array's own tier gates whether the array appears at all.
 */
function walkObject(
  obj: Record<string, unknown>,
  prefix: string,
  role: Role,
  envelope: DisclosureEnvelope,
  withheld: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    // contentHash and signature are top-level invariants — never redacted.
    if (!prefix && ALWAYS_PUBLIC.has(key)) {
      out[key] = obj[key];
      continue;
    }

    const val = obj[key];

    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      // ── Nested object ──────────────────────────────────────────────────
      // Always recurse so that more-specific child tiers can override the
      // container's tier. Include the object only if recursion yields children.
      const nested = walkObject(
        val as Record<string, unknown>,
        path,
        role,
        envelope,
        withheld,
      );
      if (Object.keys(nested).length > 0) {
        out[key] = nested;
      }
      // Child paths have already been pushed to `withheld` individually.
    } else if (Array.isArray(val)) {
      // ── Array ─────────────────────────────────────────────────────────
      const tier = resolveTier(path, envelope);
      if (canSee(role, tier)) {
        // Recurse into object elements; keep primitives as-is.
        out[key] = val.map((item) =>
          item !== null && typeof item === "object"
            ? walkObject(item as Record<string, unknown>, path, role, envelope, withheld)
            : item,
        );
      } else {
        // Field is withheld. If it's in COUNT_ONLY_PUBLIC, emit a count
        // sibling so readers know the record is substantive.
        if (COUNT_ONLY_PUBLIC.includes(path)) {
          out[`${key}Count`] = val.length;
        }
        withheld.push(path);
      }
    } else {
      // ── Primitive / null ──────────────────────────────────────────────
      const tier = resolveTier(path, envelope);
      if (canSee(role, tier)) {
        out[key] = val;
      } else {
        withheld.push(path);
      }
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Produce a role-specific view of a passport.
 *
 * Every field the role may not see is ABSENT from the returned document —
 * deletion is the only form of redaction that survives static-file
 * serialisation. The `_redaction` envelope on the result records which fields
 * were withheld and why, so a consumer knows what they are NOT seeing.
 */
export function redactForRole(passport: Passport, role: Role): RedactedPassport {
  const envelope = passport.disclosure;
  const withheld: string[] = [];

  const redacted = walkObject(
    passport as unknown as Record<string, unknown>,
    "",
    role,
    envelope,
    withheld,
  );

  // `id` and `type` are always public but guarantee the shape contract.
  const result: RedactedPassport = {
    ...(redacted as Partial<Passport>),
    id: passport.id,
    type: "DigitalProvenancePassport",
    _redaction: {
      role,
      visibleTiers: visibleTiers(role),
      withheldFields: withheld,
      envelopeVersion: envelope.envelopeVersion,
    },
  };

  return result;
}

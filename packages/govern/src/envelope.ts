/**
 * Envelope construction, validation, and disclosure explanation.
 *
 * An envelope encodes the field→tier policy and is signed into the passport
 * (ADR-005). This module lets callers build custom envelopes, validate that
 * they are internally consistent, and produce human-readable prose about what
 * a given role sees and, crucially, what it does NOT see and why.
 *
 * PROVENANCE: derived from yorkerhodes3/dpa-prototype
 *   (schemas/confidentiality-envelope.json, lib/dpa.ts).
 * See docs/DECISIONS.md#adr-005.
 */

import {
  DEFAULT_FIELD_TIERS,
  ENVELOPE_VERSION,
  defaultEnvelope,
  DisclosureTier,
  visibleTiers,
  canSee,
  ROLE_DESCRIPTIONS,
  ALL_ROLES,
} from "@dpa/schema";
import type { Role, DisclosureEnvelope } from "@dpa/schema";

// ---------------------------------------------------------------------------
// Envelope construction
// ---------------------------------------------------------------------------

/**
 * Build an envelope by merging overrides onto the v0.4 defaults.
 * `fieldTiers` in overrides are merged key-by-key (not replaced wholesale),
 * so you can override a single path without re-specifying everything else.
 */
export function buildEnvelope(overrides?: Partial<DisclosureEnvelope>): DisclosureEnvelope {
  const base = defaultEnvelope();
  if (!overrides) return base;
  return {
    envelopeVersion: overrides.envelopeVersion ?? base.envelopeVersion,
    defaultTier: overrides.defaultTier ?? base.defaultTier,
    fieldTiers: {
      ...base.fieldTiers,
      ...(overrides.fieldTiers ?? {}),
    },
  };
}

// ---------------------------------------------------------------------------
// Envelope validation
// ---------------------------------------------------------------------------

const VALID_TIERS = new Set<string>([
  "public",
  "source-community",
  "museum",
  "enforcement",
  "owner",
]);

export type ValidationResult =
  | { valid: true; warnings: string[] }
  | { valid: false; errors: string[]; warnings: string[] };

/**
 * Validate a disclosure envelope.
 *
 * Hard errors: any tier value that is not a recognised DisclosureTier.
 * Warnings: paths that are not present in `DEFAULT_FIELD_TIERS` (may be
 * intentional extensions, but worth flagging for review).
 */
export function validateEnvelope(env: DisclosureEnvelope): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!VALID_TIERS.has(env.defaultTier)) {
    errors.push(`defaultTier "${env.defaultTier}" is not a recognised DisclosureTier`);
  }

  for (const [path, tier] of Object.entries(env.fieldTiers)) {
    if (!VALID_TIERS.has(tier)) {
      errors.push(`fieldTiers["${path}"] = "${tier}" is not a recognised DisclosureTier`);
    }
    if (!(path in DEFAULT_FIELD_TIERS)) {
      warnings.push(
        `fieldTiers["${path}"] is not a known schema path — verify it is intentional`,
      );
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }
  return { valid: true, warnings };
}

// ---------------------------------------------------------------------------
// Disclosure explanation
// ---------------------------------------------------------------------------

/** A map from tier to a short human-readable summary of what it contains. */
const TIER_CONTENTS: Record<DisclosureTier, string> = {
  public:
    "object identity, title, artist, cultural context, image hash, confidence score, " +
    "coverage class, and the notarisation proof",
  "source-community":
    "claim status, custodianship terms, and source-community statements",
  museum: "physical dimensions, condition, loan eligibility, risk flags, and forensic scores",
  enforcement:
    "full provenance timeline, registry hits, current location, holder pseudonym, and contact escrow",
  owner: "holder identity and all fields above",
};

/**
 * Return prose describing what `role` sees and — importantly — what it does
 * NOT see and why. This is the human-facing companion to the machine-readable
 * `_redaction` envelope, intended for UI rendering and audit logs.
 */
export function explainDisclosure(role: Role): string {
  const seen = visibleTiers(role);
  const hidden = (["public", "source-community", "museum", "enforcement", "owner"] as DisclosureTier[])
    .filter((t) => !canSee(role, t));

  const seenLines = seen.map((t) => `  • ${t}: ${TIER_CONTENTS[t]}`).join("\n");

  const hiddenLines =
    hidden.length === 0
      ? "  (none — this role sees everything)"
      : hidden
          .map((t) => {
            const reason = hiddenReason(role, t);
            return `  • ${t}: ${TIER_CONTENTS[t]}\n    Reason: ${reason}`;
          })
          .join("\n");

  const roleLabel =
    role === "source-community"
      ? "Source community"
      : role.charAt(0).toUpperCase() + role.slice(1);

  return (
    `Role: ${roleLabel}\n` +
    `Description: ${ROLE_DESCRIPTIONS[role]}\n\n` +
    `Fields visible:\n${seenLines}\n\n` +
    `Fields withheld:\n${hiddenLines}`
  );
}

function hiddenReason(role: Role, tier: DisclosureTier): string {
  if (role === "source-community") {
    return (
      "Source communities have a legitimate interest in cultural claim information " +
      "but not in institutional or enforcement internals. The orthogonal role model " +
      "prevents this role from seeing museum or enforcement data regardless of ladder position."
    );
  }
  if (tier === "source-community") {
    return (
      "Community-facing fields (claim status, custodianship) are tagged source-community " +
      "and are not visible to ladder roles. They belong to the community, not the institution."
    );
  }
  const ladderOrder: DisclosureTier[] = ["public", "museum", "enforcement", "owner"];
  const roleIndex = ladderOrder.indexOf(role as DisclosureTier);
  const tierIndex = ladderOrder.indexOf(tier);
  if (roleIndex !== -1 && tierIndex !== -1 && roleIndex < tierIndex) {
    return `Requires "${tier}" access level; this role is at "${role}" on the disclosure ladder.`;
  }
  return `Role "${role}" does not have access to "${tier}" fields.`;
}

// Re-export for convenience
export { buildEnvelope as default, ENVELOPE_VERSION };

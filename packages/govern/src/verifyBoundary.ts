/**
 * Boundary safety-net: asserts that a redacted document contains no field
 * whose tier the requesting role may not see.
 *
 * This is the test oracle used to prove the confidentiality boundary holds
 * after every redaction. It is INTENTIONALLY independent of `redact.ts`:
 * the path-resolution walk is re-implemented here from scratch so that a
 * shared bug in a common helper cannot hide the same defect in both the
 * redactor and its validator. If both were broken in the same way, the test
 * would pass while the boundary leaked.
 *
 * PROVENANCE: original — no equivalent in dpa-prototype.
 * See docs/DECISIONS.md#adr-005.
 */

import { canSee, COUNT_ONLY_PUBLIC } from "@dpa/schema";
import type { Role, DisclosureTier, DisclosureEnvelope, RedactedPassport } from "@dpa/schema";

// ---------------------------------------------------------------------------
// Independent tier resolution (do NOT import from redact.ts)
// ---------------------------------------------------------------------------

/**
 * Resolve the tier for a dot-path, walking from most specific to least.
 * Deliberately re-implemented — not imported from redact.ts.
 */
function resolveFieldTier(path: string, envelope: DisclosureEnvelope): DisclosureTier {
  const parts = path.split(".");
  for (let i = parts.length; i > 0; i--) {
    const candidate = parts.slice(0, i).join(".");
    const tier = envelope.fieldTiers[candidate];
    if (tier !== undefined) return tier;
  }
  return envelope.defaultTier;
}

/**
 * Synthetic count keys emitted by the redactor for COUNT_ONLY_PUBLIC paths.
 * e.g. "provenanceTimelineCount" → base path "provenanceTimeline" is in COUNT_ONLY_PUBLIC.
 * These are always public; failing to recognise them would produce false alarms.
 */
function isSyntheticCountKey(path: string): boolean {
  if (!path.endsWith("Count")) return false;
  const basePath = path.slice(0, -"Count".length);
  return COUNT_ONLY_PUBLIC.includes(basePath);
}

// Fields that are always public regardless of the envelope.
const BOUNDARY_ALWAYS_PUBLIC = new Set<string>(["contentHash", "signature"]);

// ---------------------------------------------------------------------------
// Independent recursive walk
// ---------------------------------------------------------------------------

function walkAndVerify(
  node: unknown,
  path: string,
  role: Role,
  envelope: DisclosureEnvelope,
  topLevel: boolean,
): void {
  // Skip the _redaction meta block — added by the redactor, not a schema field.
  if (path === "_redaction") return;

  // contentHash, signature, and notarisation are sealing fields; they are
  // never subject to the per-field tier check.
  if (topLevel && (BOUNDARY_ALWAYS_PUBLIC.has(path) || path === "notarisation")) return;

  // Synthetic count summaries from COUNT_ONLY_PUBLIC are always public.
  if (isSyntheticCountKey(path)) return;

  if (node !== null && typeof node === "object") {
    if (Array.isArray(node)) {
      // Arrays ARE data — check the tier of the array path itself.
      const tier = resolveFieldTier(path, envelope);
      if (!canSee(role, tier)) {
        throw new LeakageError(
          `Leakage detected: field "${path}" (tier "${tier}") is present in the redacted document but role "${role}" may not see it.`,
          path,
          tier,
          role,
        );
      }
      for (const item of node) {
        if (item !== null && typeof item === "object") {
          // Array elements share the array's path for tier resolution.
          walkAndVerify(item, path, role, envelope, false);
        }
      }
    } else {
      // Plain object: the container may be present because some of its children
      // have a more specific public tier (e.g. objectIdentity.sha256 = "public"
      // even though objectIdentity = "museum"). Do NOT check the container tier —
      // it acts as a fallback for unspecified children, not as a gate.
      // Each child is checked individually below.
      for (const key of Object.keys(node as Record<string, unknown>)) {
        const childPath = path ? `${path}.${key}` : key;
        walkAndVerify(
          (node as Record<string, unknown>)[key],
          childPath,
          role,
          envelope,
          false,
        );
      }
    }
  } else {
    // Primitive or null — check the tier of this specific path.
    const tier = resolveFieldTier(path, envelope);
    if (!canSee(role, tier)) {
      throw new LeakageError(
        `Leakage detected: field "${path}" (tier "${tier}") is present in the redacted document but role "${role}" may not see it.`,
        path,
        tier,
        role,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Thrown when a field that should have been redacted is present. */
export class LeakageError extends Error {
  readonly path: string;
  readonly tier: DisclosureTier;
  readonly role: Role;

  constructor(message: string, path: string, tier: DisclosureTier, role: Role) {
    super(message);
    this.name = "LeakageError";
    this.path = path;
    this.tier = tier;
    this.role = role;
  }
}

/**
 * Walk the REDACTED document and throw `LeakageError` if any present field
 * resolves to a tier the role may not see.
 *
 * Call this after every `redactForRole` in tests to prove the boundary holds.
 * It is also appropriate to call in production before serving a static file.
 */
export function assertNoLeakage(
  redacted: RedactedPassport,
  role: Role,
  envelope: DisclosureEnvelope,
): void {
  const node = redacted as unknown as Record<string, unknown>;
  for (const key of Object.keys(node)) {
    walkAndVerify(node[key], key, role, envelope, true);
  }
}

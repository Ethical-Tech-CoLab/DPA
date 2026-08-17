/**
 * Claim filing — moving `claimStatus` through its lifecycle.
 *
 * PROVENANCE: design derived from Ethical-Tech-CoLab/digital-passport-artworks
 *   (index.html, claim status UI) by @ChristineLumen.
 *
 * ---------------------------------------------------------------------------
 * DISCLOSURE INTERACTION (ADR-005)
 *
 * A claim filed by a source community MUST be visible to that community.
 * In the DPA schema, `claimStatus`, `custodianship`, and
 * `sourceCommunityStatement` are tagged `source-community` in the default
 * field tiers (`DEFAULT_FIELD_TIERS` in @dpa/schema/envelope.ts). The
 * disclosure envelope is signed into the passport, so this visibility
 * guarantee is structural — it is a property of the record, not of any
 * particular rendering client.
 *
 * When a claim transitions to `formal-claim` or beyond, the
 * `sourceCommunityStatement` field should be populated with the community's
 * own statement so that statement is visible alongside the claim status
 * when the passport is rendered for the `source-community` role.
 *
 * No additional disclosure logic is required here: the tagged tiers already
 * ensure community-filed claim information flows to the right audiences.
 * ---------------------------------------------------------------------------
 */

import type { ClaimStatus } from "@dpa/schema";

/** Valid forward transitions for a claim. */
const TRANSITIONS: Record<ClaimStatus, ReadonlyArray<ClaimStatus>> = {
  none:                  ["informal-inquiry"],
  "informal-inquiry":    ["formal-claim", "none"],
  "formal-claim":        ["under-negotiation", "informal-inquiry"],
  "under-negotiation":   ["resolved-returned", "resolved-retained"],
  "resolved-returned":   [],
  "resolved-retained":   [],
};

export class ClaimTransitionError extends Error {
  constructor(from: ClaimStatus, to: ClaimStatus) {
    super(`Invalid claim transition: ${from} → ${to}`);
    this.name = "ClaimTransitionError";
  }
}

/**
 * Advance a claim status to the next state.
 * Throws `ClaimTransitionError` if the transition is not permitted.
 */
export function transitionClaim(current: ClaimStatus, next: ClaimStatus): ClaimStatus {
  const allowed = TRANSITIONS[current];
  if (!allowed.includes(next)) {
    throw new ClaimTransitionError(current, next);
  }
  return next;
}

export interface ClaimUpdate {
  /** The new status. */
  claimStatus: ClaimStatus;
  /** Updated custodianship terms (optional). */
  custodianship?: string | null;
  /** The source community's own statement (optional). */
  sourceCommunityStatement?: string | null;
  /** Who filed / progressed the claim. */
  filedBy: string;
  /** When the transition occurred. */
  filedAt: string;
  /** Free-text note. */
  note: string;
}

/**
 * Build a ClaimUpdate record for a valid transition.
 * The caller applies this to a passport body before re-signing.
 */
export function fileClaim(
  current: ClaimStatus,
  next: ClaimStatus,
  filedBy: string,
  note: string,
  opts?: {
    custodianship?: string | null;
    sourceCommunityStatement?: string | null;
  },
): ClaimUpdate {
  const validated = transitionClaim(current, next);
  return {
    claimStatus: validated,
    custodianship: opts?.custodianship ?? undefined,
    sourceCommunityStatement: opts?.sourceCommunityStatement ?? undefined,
    filedBy,
    filedAt: new Date().toISOString(),
    note,
  };
}

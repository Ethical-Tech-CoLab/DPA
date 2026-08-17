/**
 * Disclosure tiers and the role model.
 *
 * PROVENANCE: consolidated from yorkerhodes3/dpa-prototype
 *   (schemas/confidentiality-envelope.json, lib/dpa.ts).
 * See docs/DECISIONS.md#adr-005.
 *
 * ---------------------------------------------------------------------------
 * The role ladder is linear for four roles and ORTHOGONAL for the fifth.
 *
 *   public  <  museum  <  enforcement  <  owner
 *
 *   source-community  — sees the public tier PLUS the source-community tier,
 *                       and never sees museum or enforcement internals.
 *
 * The orthogonality is the whole point. A source community has a legitimate
 * interest in knowing that a claim exists against an object held elsewhere, and
 * no legitimate access to that holder's insurance valuation or to an open law
 * enforcement matter. Modelling it as a rung on the ladder would force a choice
 * between telling communities nothing and telling them everything.
 *
 * ⚠️ This encodes a substantive claim about what source communities should see,
 * and no source community has reviewed it. It is the weakest assertion in the
 * system. See BACKLOG.md P3-1.
 * ---------------------------------------------------------------------------
 */
import { z } from "zod";

export const Role = z.enum([
  "public",
  "source-community",
  "museum",
  "enforcement",
  "owner",
]);
export type Role = z.infer<typeof Role>;

export const ALL_ROLES: Role[] = [
  "public",
  "source-community",
  "museum",
  "enforcement",
  "owner",
];

/**
 * A disclosure tier is a property of a FIELD. A role is a property of a
 * REQUESTER. `canSee` maps one onto the other.
 */
export const DisclosureTier = z.enum([
  "public",
  "source-community",
  "museum",
  "enforcement",
  "owner",
]);
export type DisclosureTier = z.infer<typeof DisclosureTier>;

/** Linear rank. `source-community` is deliberately absent — it is not a rung. */
const LADDER: Record<string, number> = {
  public: 0,
  museum: 1,
  enforcement: 2,
  owner: 3,
};

/**
 * Can `role` see a field tagged `tier`?
 *
 * Two rules, in order:
 *
 *  1. The source-community role sees exactly two tiers: `public` and
 *     `source-community`. Nothing else, regardless of ladder position.
 *  2. Everyone else uses the linear ladder, and no ladder role except `owner`
 *     sees `source-community` fields — those belong to the community, not to
 *     the institution holding the object.
 *
 * `owner` sees everything: it is the holder's own record.
 */
export function canSee(role: Role, tier: DisclosureTier): boolean {
  if (role === "owner") return true;

  if (role === "source-community") {
    return tier === "public" || tier === "source-community";
  }

  // Ladder roles.
  if (tier === "source-community") {
    // Promoted community-facing fields (claimStatus, custodianship) are tagged
    // `source-community`; institutions reach them via their own ladder tier, so
    // a bare `source-community` tag is community-only.
    return false;
  }

  const have = LADDER[role];
  const need = LADDER[tier];
  if (have === undefined || need === undefined) return false;
  return have >= need;
}

/**
 * Every tier a role can see. Used to precompute static per-role payloads, where
 * the guarantee is physical: the file simply does not contain other tiers.
 */
export function visibleTiers(role: Role): DisclosureTier[] {
  const all: DisclosureTier[] = [
    "public",
    "source-community",
    "museum",
    "enforcement",
    "owner",
  ];
  return all.filter((t) => canSee(role, t));
}

export const ROLE_LABELS: Record<Role, string> = {
  public: "Public",
  "source-community": "Source community",
  museum: "Museum / cultural institution",
  enforcement: "Law enforcement",
  owner: "Holder (pseudonymous owner)",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  public:
    "Anyone. Sees that the object exists, its confidence score with its coverage class, and that it was notarised — and nothing that could identify or endanger the holder.",
  "source-community":
    "A community with an ancestral or territorial connection to the object. Sees the public tier plus claim status, custodianship terms and community statements. Never sees museum or enforcement internals.",
  museum:
    "An accredited cultural institution. Sees curatorial and condition detail needed to assess a loan or an acquisition.",
  enforcement:
    "Carabinieri TPC, INTERPOL, or an equivalent authority. Sees the full provenance narrative, register hits and the escrowed contact route to the holder.",
  owner:
    "The holder of the object, identified only by a pseudonymous key. Sees everything, because it is their own record.",
};

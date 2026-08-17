/**
 * Amendment — producing a new passport that supersedes a prior one.
 *
 * WHY AMENDMENT IS NOT MUTATION
 *
 * A passport is immutable once signed: the signature is a cryptographic
 * commitment to the exact canonical payload at the time of issuance. Mutating
 * a field after signing would either (a) invalidate the signature, making the
 * record unverifiable, or (b) require re-signing, which is indistinguishable
 * from producing a new record. Case (b) is an amendment: the signer produces
 * a NEW passport with a new id, new issuedAt, and the changes applied —
 * while the old passport is atomically revoked so there is never a moment
 * when two valid passports exist for the same object.
 *
 * The `supersedes` field on the new passport records this lineage. Because
 * `supersedes` is part of the canonical payload, the chain of provenance is
 * signed into every successive record, not just asserted.
 *
 * PROVENANCE: design derived from Ethical-Tech-CoLab/digital-passport-artworks
 *   (index.html, passport issuance + revocation flow) by @ChristineLumen.
 */

import type { Passport } from "@dpa/schema";
import type { StatusList } from "./statusList.js";

/**
 * A signer function: given the body (without signature), returns the
 * signature string and the contentHash. The caller provides this so that
 * amendment is independent of which issuer class is in use.
 */
export type AmendSigner = (body: Omit<Passport, "signature">) => {
  signature: string;
  contentHash: string;
};

/** A passport extended with the lineage field. */
export type AmendedPassport = Passport & { supersedes: string };

/**
 * Produce an amended passport:
 *  1. Apply `changes` to the previous passport's fields.
 *  2. Set `supersedes` to `prev.id`.
 *  3. Assign a fresh `id` and `issuedAt`.
 *  4. Allocate a new status list index for the new passport.
 *  5. Revoke `prev` in the status list.
 *  6. Recompute `contentHash` and re-sign.
 *
 * The caller must provide `statusList` so the old index is revoked and a
 * new index is allocated atomically within the same list.
 *
 * @param prev        The passport being superseded.
 * @param changes     Fields to update on the new passport (subset of Passport).
 * @param signer      Produces `{ signature, contentHash }` for the new body.
 * @param statusList  The revocation list to revoke `prev` and allocate a new index in.
 * @param listUrl     URL of the status list credential endpoint.
 */
export function amendPassport(
  prev: Passport,
  changes: Partial<Omit<Passport, "id" | "issuedAt" | "signature" | "contentHash" | "credentialStatus">>,
  signer: AmendSigner,
  statusList: StatusList,
  listUrl: string,
): AmendedPassport {
  // Revoke the predecessor's status list entry.
  statusList.revoke(prev.credentialStatus.statusListIndex);

  // Allocate a new index for the amended passport.
  const newIndex = statusList.allocateIndex();
  const newCredentialStatus = statusList.buildStatusListCredential(newIndex, listUrl);

  // Build the new body (all fields from prev, overridden by changes,
  // plus the amendment-specific fields).
  const newId = `${prev.id}-amend-${Date.now()}`;
  const newBody: Record<string, unknown> = {
    ...prev,
    ...changes,
    id: newId,
    issuedAt: new Date().toISOString(),
    credentialStatus: newCredentialStatus,
    supersedes: prev.id,
    // Placeholder; signer will compute the real value.
    contentHash: "",
    signature: "",
  };

  // Let the signer compute contentHash and signature.
  // Cast to the expected type; signer is responsible for the hash function.
  const { signature, contentHash } = signer(newBody as Omit<Passport, "signature">);
  newBody.signature = signature;
  newBody.contentHash = contentHash;

  return newBody as AmendedPassport;
}

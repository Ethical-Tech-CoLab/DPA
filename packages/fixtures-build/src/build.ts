/**
 * The one place a demo passport is built.
 *
 * Extracted from the generator so the CLI, the API server and the static-site
 * generator all run the identical seven stages over the identical inputs. If
 * they each assembled their own `PipelineInput` they would eventually drift,
 * and a score printed in a terminal would stop matching the score rendered on
 * the site — which is precisely the class of inconsistency this whole
 * consolidation exists to remove.
 */

import { runPipeline, type PipelineResult } from "@dpa/pipeline";
import type { CaseInput } from "./cases/types.js";

/** Frozen so every build is byte-identical and diffs mean something. */
export const ISSUED_AT = "2026-02-01T00:00:00.000Z";

export const STATUS_LIST =
  "https://ethical-tech-colab.github.io/DPA/api/status/revocation.json";

export async function buildPassport(
  caseInput: CaseInput,
  statusListIndex = 0,
): Promise<PipelineResult> {
  return runPipeline({
    id: caseInput.id,
    artwork: {
      ...caseInput.artwork,
      imageHash: caseInput.identity.sha256,
    },
    objectIdentity: {
      sha256: caseInput.identity.sha256,
      dHash: caseInput.identity.dHash,
      angleCount: caseInput.identity.angleCount,
      embeddingRef: null,
      duplicateOf: null,
      similarityScore: null,
    },
    forensicSignals: caseInput.identity.forensicSignals,
    recorded: {
      timeline: caseInput.evidence,
      registryChecks: caseInput.registryChecks,
    },
    premiumChecks: caseInput.premiumChecks,
    coverage: caseInput.coverage,
    claimStatus: caseInput.claimStatus,
    custodianship: caseInput.custodianship,
    sourceCommunityStatement: caseInput.sourceCommunityStatement,
    condition: caseInput.condition,
    loanEligibility: caseInput.loanEligibility,
    holderPseudonym: caseInput.holderPseudonym,
    contactEscrow: caseInput.contactEscrow,
    holderIdentity: caseInput.holderIdentity,
    issuerName: caseInput.issuerName,
    issuerSeed: caseInput.id,
    statusListIndex,
    statusListCredential: STATUS_LIST,
    issuedAt: ISSUED_AT,
    mode: "fixtures",
  });
}

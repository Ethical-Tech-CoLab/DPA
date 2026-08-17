/**
 * General-knowledge answer policy (ADR-008).
 *
 * PROVENANCE: generalised from Ethical-Tech-CoLab/provenance-search
 *   (server.js — the Gemini general-knowledge answer path).
 *   See docs/DECISIONS.md#adr-008.
 */
import type { TimelineEvent, RiskFlag } from "@dpa/schema";

/**
 * Wrap a general-knowledge answer as a TimelineEvent, enforcing the policy:
 *
 *  - `isGeneralKnowledge: true` is always set.
 *  - `tier` is always `"inferred"` — never `"verifiedByAuthority"`.
 *  - `confidence` is capped at 0.35 (the inferred tier ceiling).
 *
 * The `unsourcedAssertion` RiskFlag this generates is returned alongside the
 * event so the caller can attach it to the passport's riskAssessment.flags.
 */
export function wrapGeneralKnowledge(params: {
  event: string;
  date: string | null;
  location: string | null;
  /** A URL for the model knowledge base or tool that produced this. */
  sourceUrl: string;
  verifiedBy?: string;
}): { event: TimelineEvent; flag: RiskFlag } {
  const event: TimelineEvent = {
    event: params.event,
    date: params.date,
    location: params.location,
    source: params.sourceUrl,
    sourceType: "general-knowledge",
    verifiedBy: params.verifiedBy ?? "Model general knowledge",
    tier: "inferred",
    confidence: 0.3,
    isGeneralKnowledge: true,
  };

  const flag: RiskFlag = {
    type: "unsourcedAssertion",
    severity: "medium",
    evidence: `An assertion was produced from model general knowledge rather than a retrieved document: "${params.event.slice(0, 120)}…"`,
    source: params.sourceUrl,
  };

  return { event, flag };
}

/**
 * Assert that a timeline event marked `isGeneralKnowledge` was built
 * correctly.  Throws if the invariants are violated.  Call this in tests
 * and in any code path that assembles events from untrusted input.
 */
export function assertGeneralKnowledgePolicy(ev: TimelineEvent): void {
  if (!ev.isGeneralKnowledge) return; // policy only applies to GK events
  if (ev.tier === "verifiedByAuthority") {
    throw new Error(
      `Policy violation: a general-knowledge event may never have tier` +
        ` "verifiedByAuthority". Event: "${ev.event}"`,
    );
  }
}

/**
 * Core types for the evidence-gathering pipeline (ADR-008).
 *
 * PROVENANCE: new — defines the connector contract that unifies sources
 *   from Ethical-Tech-CoLab/arts-provenance-agent (tavily.ts, wikidata.ts,
 *   registries.ts) and Ethical-Tech-CoLab/provenance-search (server.js).
 *   See docs/DECISIONS.md#adr-008.
 */
import type { TimelineEvent } from "@dpa/schema";

/* -------------------------------------------------------------------------- */
/* Query and context                                                           */
/* -------------------------------------------------------------------------- */

export interface EvidenceQuery {
  title: string;
  artist?: string | undefined;
  culture?: string | undefined;
  period?: string | undefined;
  /** Extra free-text context (medium, accession number, etc.). */
  context?: string | undefined;
}

/** Runtime context injected into every connector. */
export interface ConnectorContext {
  mode: "fixtures" | "live";
  /**
   * `fetch` implementation to use.  Callers in Node should pass global
   * fetch (available since Node 18) or a polyfill.  Defaults to
   * `globalThis.fetch`.
   */
  fetchImpl?: typeof globalThis.fetch;
  /** Environment variables (for API keys, etc.). Defaults to process.env. */
  env?: Record<string, string | undefined>;
}

/* -------------------------------------------------------------------------- */
/* Result                                                                      */
/* -------------------------------------------------------------------------- */

export interface EvidenceClaim {
  /** Human-readable description of the fact asserted. */
  text: string;
  /** Canonical source URL.  REQUIRED — no source, no claim. */
  sourceUrl: string;
  sourceTitle: string;
  tier: TimelineEvent["tier"];
  date: string | null;
  location: string | null;
  isGeneralKnowledge?: boolean;
  /** Extra data carried through to TimelineEvent conversion. */
  verifiedBy: string;
  sourceType: string;
}

export interface EvidenceResult {
  connectorId: string;
  claims: EvidenceClaim[];
  /** Number of hits returned by the remote source before filtering. */
  rawHitCount: number;
  error?: string | undefined;
}

/** Convert an EvidenceClaim to a TimelineEvent. */
export function claimToTimelineEvent(
  claim: EvidenceClaim,
): TimelineEvent {
  return {
    event: claim.text,
    date: claim.date,
    location: claim.location,
    source: claim.sourceUrl,
    sourceType: claim.sourceType,
    verifiedBy: claim.verifiedBy,
    tier: claim.tier,
    confidence: tierToConfidence(claim.tier),
    isGeneralKnowledge: claim.isGeneralKnowledge ?? false,
  };
}

function tierToConfidence(tier: TimelineEvent["tier"]): number {
  switch (tier) {
    case "verifiedByAuthority": return 0.9;
    case "reportedInPress": return 0.6;
    case "inferred": return 0.35;
  }
}

/* -------------------------------------------------------------------------- */
/* Connector interface                                                         */
/* -------------------------------------------------------------------------- */

export interface EvidenceConnector {
  id: string;
  name: string;
  access: "structured-api" | "grounded-search" | "referral-only" | "paid-x402";
  /** Is this a register (theft/loss) or a scholarly/museum source? */
  kind: "register" | "scholarly";
  search(q: EvidenceQuery, ctx: ConnectorContext): Promise<EvidenceResult>;
}

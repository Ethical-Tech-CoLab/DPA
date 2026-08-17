/**
 * Evidence gathering orchestrator (ADR-008).
 *
 * PROVENANCE: new module combining the connector dispatch pattern from
 *   Ethical-Tech-CoLab/arts-provenance-agent (registries.ts) with the
 *   multi-source fan-out from Ethical-Tech-CoLab/provenance-search
 *   (server.js /api/verify handler). See docs/DECISIONS.md#adr-008.
 */
import type { TimelineEvent, RegistryCheckRecord } from "@dpa/schema";
import type {
  EvidenceConnector,
  EvidenceQuery,
  EvidenceClaim,
  ConnectorContext,
} from "./types.js";
import { claimToTimelineEvent } from "./types.js";
import { assertGeneralKnowledgePolicy } from "./generalKnowledge.js";
import { checkRegistries } from "./registers.js";
import type { RegisterCheckOptions } from "./registers.js";

// Connectors
import { TavilyConnector } from "./connectors/tavily.js";
import { WikidataConnector } from "./connectors/wikidata.js";
import { MetConnector } from "./connectors/met.js";
import { ArtInstituteChicagoConnector } from "./connectors/artInstituteChicago.js";
import { MoMAConnector } from "./connectors/moma.js";
import { WikipediaConnector } from "./connectors/wikipedia.js";
import { EuropeanaConnector } from "./connectors/europeana.js";
import { GeneralKnowledgeConnector } from "./connectors/generalKnowledge.js";

/* -------------------------------------------------------------------------- */
/* Default connector set                                                       */
/* -------------------------------------------------------------------------- */

export const DEFAULT_CONNECTORS: EvidenceConnector[] = [
  new TavilyConnector(),
  new WikidataConnector(),
  new MetConnector(),
  new ArtInstituteChicagoConnector(),
  new MoMAConnector(),
  new WikipediaConnector(),
  new EuropeanaConnector(),
  new GeneralKnowledgeConnector(),
];

/* -------------------------------------------------------------------------- */
/* Recorded evidence                                                           */
/* -------------------------------------------------------------------------- */

/**
 * A previously-recorded evidence set, supplied by the caller.
 *
 * This package deliberately holds NO case data. Demo objects live in
 * @dpa/fixtures-build and are injected here, so the evidence service cannot
 * become a place where a hand-authored answer hides behind a lookup key.
 */
export interface RecordedEvidence {
  timeline: TimelineEvent[];
  registryChecks: RegistryCheckRecord[];
}

/* -------------------------------------------------------------------------- */
/* Deduplication                                                               */
/* -------------------------------------------------------------------------- */

function deduplicate(claims: EvidenceClaim[]): EvidenceClaim[] {
  const seen = new Set<string>();
  return claims.filter((c) => {
    // Deduplicate on source URL + first 60 chars of text
    const key = `${c.sourceUrl}|${c.text.slice(0, 60)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

export interface GatherOptions {
  mode?: "fixtures" | "live";
  /**
   * Pre-recorded evidence for this object, supplied by the caller. When
   * present in fixtures mode it is returned directly with no network I/O.
   */
  recorded?: RecordedEvidence;
  connectors?: EvidenceConnector[];
  registerOpts?: RegisterCheckOptions;
  fetchImpl?: typeof globalThis.fetch;
  env?: Record<string, string | undefined>;
}

export interface GatherResult {
  timeline: TimelineEvent[];
  registryChecks: RegistryCheckRecord[];
  sourcesConsulted: string[];
  mode: "fixtures" | "live";
}

/**
 * Gather all evidence for one object.
 *
 * In **fixtures mode** (default) any `recorded` evidence the caller supplies is
 * returned directly — no network I/O. In **live mode** all connectors are
 * queried concurrently and the results are merged and deduplicated.
 *
 * Every general-knowledge event is validated against the policy
 * (`assertGeneralKnowledgePolicy`) before inclusion.
 */
export async function gatherEvidence(
  query: EvidenceQuery,
  opts: GatherOptions = {},
): Promise<GatherResult> {
  const mode =
    opts.mode ??
    (typeof process !== "undefined" && process.env["DPA_MODE"] === "live"
      ? "live"
      : "fixtures");

  if (mode === "fixtures" && opts.recorded) {
    return {
      timeline: opts.recorded.timeline,
      registryChecks: opts.recorded.registryChecks,
      sourcesConsulted: ["recorded"],
      mode: "fixtures",
    };
  }

  const connectors = opts.connectors ?? DEFAULT_CONNECTORS;
  const ctx: ConnectorContext = {
    mode,
    fetchImpl: opts.fetchImpl,
    env: opts.env ?? (typeof process !== "undefined" ? process.env as Record<string, string | undefined> : {}),
  };

  // Fan out to all connectors concurrently
  const results = await Promise.all(
    connectors.map((c) => c.search(query, ctx).catch((e: unknown) => ({
      connectorId: c.id,
      claims: [],
      rawHitCount: 0,
      error: String(e),
    }))),
  );

  // Collect and deduplicate claims
  const allClaims = deduplicate(
    results.flatMap((r) => r.claims),
  );

  // Build timeline events
  const timeline: TimelineEvent[] = allClaims.map((c) => {
    const ev = claimToTimelineEvent(c);
    assertGeneralKnowledgePolicy(ev);
    return ev;
  });

  // Register checks
  const registerSummary = await checkRegistries(
    query.title,
    query.artist,
    {
      ...(opts.registerOpts ?? {}),
      live: mode === "live",
      fetchImpl: opts.fetchImpl,
    },
  );

  const sourcesConsulted = results
    .filter((r) => r.claims.length > 0 || !r.error)
    .map((r) => r.connectorId);

  return {
    timeline,
    registryChecks: registerSummary.checks,
    sourcesConsulted,
    mode,
  };
}

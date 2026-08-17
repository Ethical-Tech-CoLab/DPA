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

// Fixtures
import {
  BURA_ASKOS_TIMELINE,
  BURA_ASKOS_REGISTRY_CHECKS,
  BENIN_BRONZE_TIMELINE,
  BENIN_BRONZE_REGISTRY_CHECKS,
  GETTY_BRONZE_TIMELINE,
  GETTY_BRONZE_REGISTRY_CHECKS,
  SCHIELE_WALLY_TIMELINE,
  SCHIELE_WALLY_REGISTRY_CHECKS,
} from "./fixtures/index.js";

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
/* Fixture catalogue                                                           */
/* -------------------------------------------------------------------------- */

interface FixtureEntry {
  timeline: TimelineEvent[];
  registryChecks: RegistryCheckRecord[];
}

const FIXTURES: Record<string, FixtureEntry> = {
  "bura-askos": {
    timeline: BURA_ASKOS_TIMELINE,
    registryChecks: BURA_ASKOS_REGISTRY_CHECKS,
  },
  "benin-bronze": {
    timeline: BENIN_BRONZE_TIMELINE,
    registryChecks: BENIN_BRONZE_REGISTRY_CHECKS,
  },
  "getty-bronze": {
    timeline: GETTY_BRONZE_TIMELINE,
    registryChecks: GETTY_BRONZE_REGISTRY_CHECKS,
  },
  "schiele-wally": {
    timeline: SCHIELE_WALLY_TIMELINE,
    registryChecks: SCHIELE_WALLY_REGISTRY_CHECKS,
  },
};

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
   * Fixture key to look up (e.g. "bura-askos"). Required in fixtures mode
   * unless `connectors` are provided separately.
   */
  fixtureKey?: string;
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
 * In **fixtures mode** (default) the pre-built fixture data is returned
 * directly — no network I/O.  In **live mode** all connectors are queried
 * concurrently and the results are merged and deduplicated.
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

  if (mode === "fixtures") {
    const key = opts.fixtureKey;
    const fixture = key ? FIXTURES[key] : undefined;
    if (fixture) {
      return {
        timeline: fixture.timeline,
        registryChecks: fixture.registryChecks,
        sourcesConsulted: ["fixtures"],
        mode: "fixtures",
      };
    }
    // No fixture key — run connectors in fixtures mode
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

/**
 * @dpa/evidence — evidence-gathering pipeline: sources, registers, fixtures.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/arts-provenance-agent and
 *   Ethical-Tech-CoLab/provenance-search. See docs/DECISIONS.md#adr-008.
 */
export type {
  EvidenceQuery,
  ConnectorContext,
  EvidenceClaim,
  EvidenceResult,
  EvidenceConnector,
} from "./types.js";
export { claimToTimelineEvent } from "./types.js";

export { wrapGeneralKnowledge, assertGeneralKnowledgePolicy } from "./generalKnowledge.js";
export { SOURCE_BIAS_NOTE, SOURCE_BIAS } from "./sourceBias.js";

export type { RegisterCheckOptions, RegisterSummary } from "./registers.js";
export { REGISTRIES, checkRegistries } from "./registers.js";

export type { GatherOptions, GatherResult } from "./gather.js";
export { gatherEvidence, DEFAULT_CONNECTORS } from "./gather.js";

// Connectors
export { TavilyConnector } from "./connectors/tavily.js";
export { WikidataConnector } from "./connectors/wikidata.js";
export { MetConnector } from "./connectors/met.js";
export { ArtInstituteChicagoConnector } from "./connectors/artInstituteChicago.js";
export { MoMAConnector } from "./connectors/moma.js";
export { WikipediaConnector } from "./connectors/wikipedia.js";
export { EuropeanaConnector } from "./connectors/europeana.js";
export { GeneralKnowledgeConnector } from "./connectors/generalKnowledge.js";

// Fixtures
export {
  BURA_ASKOS_TIMELINE,
  BURA_ASKOS_REGISTRY_CHECKS,
  BENIN_BRONZE_TIMELINE,
  BENIN_BRONZE_REGISTRY_CHECKS,
  GETTY_BRONZE_TIMELINE,
  GETTY_BRONZE_REGISTRY_CHECKS,
  SCHIELE_WALLY_TIMELINE,
  SCHIELE_WALLY_REGISTRY_CHECKS,
} from "./fixtures/index.js";

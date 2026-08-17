/**
 * Europeana — pan-European cultural heritage aggregator connector.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/provenance-search
 *   (server.js — searchEuropeana). Endpoint, field mapping and API-key
 *   guard preserved verbatim. See docs/DECISIONS.md#adr-008.
 */
import type {
  EvidenceConnector,
  EvidenceQuery,
  EvidenceResult,
  EvidenceClaim,
  ConnectorContext,
} from "../types.js";

interface EuropeanaItem {
  title?: string | string[];
  dataProvider?: string | string[];
  guid?: string;
  link?: string;
}

const FIXTURES: EvidenceClaim[] = [
  {
    text: "Fixture: Europeana connector unavailable in fixtures mode.",
    sourceUrl: "https://www.europeana.eu",
    sourceTitle: "Europeana (fixtures fallback)",
    tier: "inferred",
    date: null,
    location: null,
    verifiedBy: "Europeana",
    sourceType: "museum-api",
  },
];

export class EuropeanaConnector implements EvidenceConnector {
  readonly id = "europeana";
  readonly name = "Europeana";
  readonly access = "structured-api" as const;
  readonly kind = "scholarly" as const;

  async search(
    q: EvidenceQuery,
    ctx: ConnectorContext,
  ): Promise<EvidenceResult> {
    if (ctx.mode === "fixtures") {
      return { connectorId: this.id, claims: FIXTURES, rawHitCount: 0 };
    }

    const apiKey = ctx.env?.["EUROPEANA_API_KEY"];
    if (!apiKey) {
      return {
        connectorId: this.id,
        claims: [],
        rawHitCount: 0,
        error: "EUROPEANA_API_KEY not set",
      };
    }

    const fetchImpl = ctx.fetchImpl ?? globalThis.fetch;
    const query = [q.title, q.artist].filter(Boolean).join(" ");

    try {
      const res = await fetchImpl(
        `https://api.europeana.eu/record/v2/search.json?query=${encodeURIComponent(query)}&wskey=${apiKey}&rows=3`,
      );
      if (!res.ok) {
        return {
          connectorId: this.id,
          claims: [],
          rawHitCount: 0,
          error: `HTTP ${res.status}`,
        };
      }
      const data = (await res.json()) as { items?: EuropeanaItem[] };
      const items = data.items ?? [];

      const claims: EvidenceClaim[] = items.map((o) => {
        const title = Array.isArray(o.title) ? (o.title[0] ?? "Untitled") : (o.title ?? "Untitled");
        const provider = Array.isArray(o.dataProvider)
          ? (o.dataProvider[0] ?? "Europeana")
          : (o.dataProvider ?? "Europeana");
        const url = o.guid ?? o.link ?? "https://www.europeana.eu";
        return {
          text: `${title} — via ${provider}`,
          sourceUrl: url,
          sourceTitle: `Europeana: ${title}`,
          tier: "verifiedByAuthority" as const,
          date: null,
          location: null,
          verifiedBy: `Europeana / ${provider}`,
          sourceType: "museum-api",
        };
      });

      return { connectorId: this.id, claims, rawHitCount: items.length };
    } catch (e) {
      return {
        connectorId: this.id,
        claims: [],
        rawHitCount: 0,
        error: String(e),
      };
    }
  }
}

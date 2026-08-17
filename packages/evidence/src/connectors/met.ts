/**
 * The Metropolitan Museum of Art — open Collections API connector.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/provenance-search
 *   (server.js — searchMet). Endpoint, field names and error handling
 *   preserved verbatim. See docs/DECISIONS.md#adr-008.
 */
import type {
  EvidenceConnector,
  EvidenceQuery,
  EvidenceResult,
  EvidenceClaim,
  ConnectorContext,
} from "../types.js";

interface MetObject {
  title?: string;
  artistDisplayName?: string;
  objectDate?: string;
  medium?: string;
  creditLine?: string;
  objectURL?: string;
  objectID?: number;
}

const FIXTURES: EvidenceClaim[] = [
  {
    text: "Fixture: Met Museum connector unavailable in fixtures mode.",
    sourceUrl: "https://www.metmuseum.org",
    sourceTitle: "The Metropolitan Museum of Art (fixtures fallback)",
    tier: "inferred",
    date: null,
    location: null,
    verifiedBy: "The Metropolitan Museum of Art",
    sourceType: "museum-api",
  },
];

export class MetConnector implements EvidenceConnector {
  readonly id = "met";
  readonly name = "The Metropolitan Museum of Art";
  readonly access = "structured-api" as const;
  readonly kind = "scholarly" as const;

  async search(
    q: EvidenceQuery,
    ctx: ConnectorContext,
  ): Promise<EvidenceResult> {
    if (ctx.mode === "fixtures") {
      return { connectorId: this.id, claims: FIXTURES, rawHitCount: 0 };
    }

    const fetchImpl = ctx.fetchImpl ?? globalThis.fetch;
    const query = [q.title, q.artist].filter(Boolean).join(" ");

    try {
      const searchRes = await fetchImpl(
        `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(query)}`,
      );
      if (!searchRes.ok) {
        return {
          connectorId: this.id,
          claims: [],
          rawHitCount: 0,
          error: `HTTP ${searchRes.status}`,
        };
      }
      const searchData = (await searchRes.json()) as {
        objectIDs?: number[];
      };
      const ids = (searchData.objectIDs ?? []).slice(0, 3);
      if (!ids.length) {
        return { connectorId: this.id, claims: [], rawHitCount: 0 };
      }

      const details = await Promise.all(
        ids.map((id) =>
          fetchImpl(
            `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,
          )
            .then((r) => r.json() as Promise<MetObject>)
            .catch(() => null),
        ),
      );

      const claims: EvidenceClaim[] = details
        .filter((o): o is MetObject => o !== null)
        .map((o) => ({
          text: `${o.title ?? "Untitled"} — ${o.artistDisplayName ?? "Unknown artist"}, ${o.objectDate ?? "date unknown"}. ${o.creditLine ?? ""}`.trim(),
          sourceUrl: o.objectURL ?? "https://www.metmuseum.org",
          sourceTitle: `Met Museum: ${o.title ?? "object"}`,
          tier: "verifiedByAuthority" as const,
          date: o.objectDate ?? null,
          location: "The Metropolitan Museum of Art, New York",
          verifiedBy: "The Metropolitan Museum of Art",
          sourceType: "museum-api",
        }));

      return {
        connectorId: this.id,
        claims,
        rawHitCount: ids.length,
      };
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

/**
 * MoMA (Museum of Modern Art) — bundled open dataset connector.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/provenance-search
 *   (server.js — searchMoma). The upstream uses a bundled MOMA_ARTWORKS
 *   in-memory dataset (MoMA's GitHub open data). We replicate the search
 *   strategy (title + artist token match) but fetch only minimal fixture
 *   data in fixtures mode; in live mode the caller is expected to supply
 *   the dataset via the context or we fall through gracefully.
 *   See docs/DECISIONS.md#adr-008.
 */
import type {
  EvidenceConnector,
  EvidenceQuery,
  EvidenceResult,
  EvidenceClaim,
  ConnectorContext,
} from "../types.js";

interface MoMAEntry {
  t: string; // title
  a: string; // artist
  d?: string; // date
  m?: string; // medium
  c?: string; // credit line
  u?: string; // url
}

/** In live mode, use the MoMA GitHub open-data CSV-derived endpoint. */
const MOMA_SEARCH_URL =
  "https://raw.githubusercontent.com/MuseumofModernArt/collection/main/Artworks.json";

const FIXTURES: EvidenceClaim[] = [
  {
    text: "Fixture: MoMA connector unavailable in fixtures mode.",
    sourceUrl: "https://www.moma.org",
    sourceTitle: "Museum of Modern Art (fixtures fallback)",
    tier: "inferred",
    date: null,
    location: null,
    verifiedBy: "Museum of Modern Art",
    sourceType: "museum-api",
  },
];

export class MoMAConnector implements EvidenceConnector {
  readonly id = "moma";
  readonly name = "MoMA (Museum of Modern Art)";
  readonly access = "structured-api" as const;
  readonly kind = "scholarly" as const;

  async search(
    q: EvidenceQuery,
    ctx: ConnectorContext,
  ): Promise<EvidenceResult> {
    if (ctx.mode === "fixtures") {
      return { connectorId: this.id, claims: FIXTURES, rawHitCount: 0 };
    }

    const titleTokens = q.title.toLowerCase().split(/\s+/).filter(Boolean);
    const artistTokens = (q.artist ?? "")
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);

    const fetchImpl = ctx.fetchImpl ?? globalThis.fetch;

    try {
      // Attempt to fetch and search the open dataset
      const res = await fetchImpl(MOMA_SEARCH_URL);
      if (!res.ok) {
        return {
          connectorId: this.id,
          claims: [],
          rawHitCount: 0,
          error: `HTTP ${res.status}`,
        };
      }
      const artworks = (await res.json()) as MoMAEntry[];
      const hits: EvidenceClaim[] = [];
      for (const a of artworks) {
        const hay = `${a.t} ${a.a}`.toLowerCase();
        const titleMatches = titleTokens.every((t) => hay.includes(t));
        const artistMatches =
          artistTokens.length === 0 ||
          artistTokens.some((t) => hay.includes(t));
        if (titleMatches && artistMatches) {
          hits.push({
            text: `${a.t} — ${a.a}${a.d ? `, ${a.d}` : ""}. ${a.c ?? ""}`.trim(),
            sourceUrl: a.u ?? "https://www.moma.org",
            sourceTitle: `MoMA: ${a.t}`,
            tier: "verifiedByAuthority" as const,
            date: a.d ?? null,
            location: "Museum of Modern Art, New York",
            verifiedBy: "Museum of Modern Art",
            sourceType: "museum-api",
          });
          if (hits.length >= 3) break;
        }
      }

      return {
        connectorId: this.id,
        claims: hits,
        rawHitCount: hits.length,
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

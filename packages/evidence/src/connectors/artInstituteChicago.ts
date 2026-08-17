/**
 * Art Institute of Chicago — open Collections API connector.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/provenance-search
 *   (server.js — searchAIC). Endpoint, field list and error handling
 *   preserved verbatim. See docs/DECISIONS.md#adr-008.
 */
import type {
  EvidenceConnector,
  EvidenceQuery,
  EvidenceResult,
  EvidenceClaim,
  ConnectorContext,
} from "../types.js";

interface AICObject {
  id?: number;
  title?: string;
  artist_display?: string;
  date_display?: string;
  medium_display?: string;
  provenance_text?: string | null;
}

const FIXTURES: EvidenceClaim[] = [
  {
    text: "Fixture: Art Institute of Chicago connector unavailable in fixtures mode.",
    sourceUrl: "https://www.artic.edu",
    sourceTitle: "Art Institute of Chicago (fixtures fallback)",
    tier: "inferred",
    date: null,
    location: null,
    verifiedBy: "Art Institute of Chicago",
    sourceType: "museum-api",
  },
];

export class ArtInstituteChicagoConnector implements EvidenceConnector {
  readonly id = "art-institute-chicago";
  readonly name = "Art Institute of Chicago";
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
    const fields = "id,title,artist_display,date_display,medium_display,provenance_text";

    try {
      const res = await fetchImpl(
        `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(query)}&fields=${fields}&limit=3`,
      );
      if (!res.ok) {
        return {
          connectorId: this.id,
          claims: [],
          rawHitCount: 0,
          error: `HTTP ${res.status}`,
        };
      }
      const data = (await res.json()) as { data?: AICObject[] };
      const items = data.data ?? [];

      const claims: EvidenceClaim[] = items.map((o) => {
        const provNote = o.provenance_text
          ? ` Provenance: ${o.provenance_text.slice(0, 200)}`
          : "";
        return {
          text: `${o.title ?? "Untitled"} — ${o.artist_display ?? "Unknown artist"}, ${o.date_display ?? "date unknown"}.${provNote}`.trim(),
          sourceUrl: o.id
            ? `https://www.artic.edu/artworks/${o.id}`
            : "https://www.artic.edu",
          sourceTitle: `AIC: ${o.title ?? "object"}`,
          tier: "verifiedByAuthority" as const,
          date: o.date_display ?? null,
          location: "Art Institute of Chicago",
          verifiedBy: "Art Institute of Chicago",
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

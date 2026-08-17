/**
 * Wikipedia connector — contextual background, not authoritative.
 *
 * PROVENANCE: new connector inspired by Ethical-Tech-CoLab/provenance-search
 *   (server.js — Wikipedia was initially included then removed from the
 *   verify pipeline as "not credible enough for academic/professional
 *   provenance use"). Included here as a background-context source only,
 *   with tier always "reportedInPress" to reflect its community-edited
 *   nature. See docs/DECISIONS.md#adr-008.
 */
import type {
  EvidenceConnector,
  EvidenceQuery,
  EvidenceResult,
  EvidenceClaim,
  ConnectorContext,
} from "../types.js";

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const UA = "dpa-evidence/0.4 (https://github.com/Ethical-Tech-CoLab/DPA)";

const FIXTURES: EvidenceClaim[] = [
  {
    text: "Fixture: Wikipedia connector unavailable in fixtures mode.",
    sourceUrl: "https://en.wikipedia.org",
    sourceTitle: "Wikipedia (fixtures fallback)",
    tier: "inferred",
    date: null,
    location: null,
    verifiedBy: "Wikipedia (community-edited)",
    sourceType: "wiki",
  },
];

export class WikipediaConnector implements EvidenceConnector {
  readonly id = "wikipedia";
  readonly name = "Wikipedia (background context)";
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
      const url = new URL(WIKIPEDIA_API);
      url.searchParams.set("action", "query");
      url.searchParams.set("list", "search");
      url.searchParams.set("srsearch", query);
      url.searchParams.set("srlimit", "3");
      url.searchParams.set("format", "json");
      url.searchParams.set("origin", "*");

      const res = await fetchImpl(url.toString(), {
        headers: { "User-Agent": UA },
      });
      if (!res.ok) {
        return {
          connectorId: this.id,
          claims: [],
          rawHitCount: 0,
          error: `HTTP ${res.status}`,
        };
      }
      const data = (await res.json()) as {
        query?: {
          search?: Array<{
            title?: string;
            snippet?: string;
            pageid?: number;
          }>;
        };
      };
      const results = data.query?.search ?? [];

      const claims: EvidenceClaim[] = results.map((r) => {
        const title = r.title ?? "Untitled";
        const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
        // Strip HTML from snippet
        const snippet = (r.snippet ?? "").replace(/<[^>]+>/g, "").trim();
        return {
          text: `${title}: ${snippet}`,
          sourceUrl: pageUrl,
          sourceTitle: `Wikipedia: ${title}`,
          // Wikipedia is community-edited — always reportedInPress
          tier: "reportedInPress" as const,
          date: null,
          location: null,
          verifiedBy: "Wikipedia (community-edited; not authoritative)",
          sourceType: "wiki",
        };
      });

      return {
        connectorId: this.id,
        claims,
        rawHitCount: results.length,
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

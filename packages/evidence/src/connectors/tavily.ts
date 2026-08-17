/**
 * Tavily grounded-search connector.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/arts-provenance-agent
 *   (src/tools/tavily.ts — tavilySearch, AUTHORITATIVE_DOMAINS).
 *   The allowlist, bias note, and fixture-fallback logic are preserved
 *   verbatim. See docs/DECISIONS.md#adr-008.
 */
import type {
  EvidenceConnector,
  EvidenceQuery,
  EvidenceResult,
  EvidenceClaim,
  ConnectorContext,
} from "../types.js";

/**
 * Authoritative-source allowlist ("Susan's list") — see upstream for the
 * full coverage-bias note, preserved in sourceBias.ts.
 */
export const AUTHORITATIVE_DOMAINS = [
  "metmuseum.org",
  "unesco.org",
  "whc.unesco.org",
  "icom.museum",
  "getty.edu",
  "culturalheritage.gov",
  "interpol.int",
  "fbi.gov",
  "carabinieri.it",
  "beniculturali.it",
  "lostart.de",
  "kulturgutverluste.de",
  "proveana.de",
  "artloss.com",
] as const;

function hostAuthority(url: string): string {
  try {
    const h = new URL(url).hostname;
    if (h.includes("metmuseum")) return "The Metropolitan Museum of Art";
    if (h.includes("unesco")) return "UNESCO";
    if (h.includes("artloss")) return "Art Loss Register";
    if (h.includes("icom")) return "ICOM";
    if (h.includes("interpol")) return "INTERPOL — Cultural Heritage Crime Unit";
    if (h.includes("fbi.gov")) return "FBI Art Crime Team";
    if (h.includes("carabinieri")) return "Carabinieri TPC (Italy)";
    if (h.includes("beniculturali")) return "Ministero della Cultura (Italy)";
    if (
      h.includes("lostart") ||
      h.includes("kulturgutverluste") ||
      h.includes("proveana")
    ) {
      return "German Lost Art Foundation";
    }
    if (h.includes("getty")) return "Getty Research Institute";
    if (h.includes(".gov")) return "Government cultural authority";
  } catch {
    /* noop */
  }
  return "web source";
}

function tierFromAuthority(
  authority: string,
): EvidenceClaim["tier"] {
  return authority === "web source" ? "reportedInPress" : "verifiedByAuthority";
}

/** Minimal fixture for offline operation. */
const FIXTURES: EvidenceClaim[] = [
  {
    text: "Fixture: Tavily search unavailable in fixtures mode.",
    sourceUrl: "https://tavily.com",
    sourceTitle: "Tavily (fixtures fallback)",
    tier: "inferred",
    date: null,
    location: null,
    verifiedBy: "Fixtures",
    sourceType: "web",
  },
];

export class TavilyConnector implements EvidenceConnector {
  readonly id = "tavily";
  readonly name = "Tavily — provenance & looting research";
  readonly access = "grounded-search" as const;
  readonly kind = "scholarly" as const;

  async search(
    q: EvidenceQuery,
    ctx: ConnectorContext,
  ): Promise<EvidenceResult> {
    if (ctx.mode === "fixtures") {
      return { connectorId: this.id, claims: FIXTURES, rawHitCount: 0 };
    }

    const apiKey = ctx.env?.["TAVILY_API_KEY"];
    if (!apiKey) {
      return {
        connectorId: this.id,
        claims: [],
        rawHitCount: 0,
        error: "TAVILY_API_KEY not set",
      };
    }

    const fetchImpl = ctx.fetchImpl ?? globalThis.fetch;
    const queryText = [
      q.title,
      q.artist,
      "provenance ownership history looting theft restitution",
    ]
      .filter(Boolean)
      .join(" ");

    try {
      const res = await fetchImpl("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query: queryText,
          search_depth: "advanced",
          include_domains: AUTHORITATIVE_DOMAINS,
          max_results: 6,
        }),
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
        results?: Array<{ title?: string; url?: string; content?: string }>;
      };
      const results = data.results ?? [];
      const claims: EvidenceClaim[] = results.map((r) => {
        const url = r.url ?? "https://tavily.com";
        const who = hostAuthority(url);
        return {
          text: r.title ?? "Untitled",
          sourceUrl: url,
          sourceTitle: r.title ?? "Untitled",
          tier: tierFromAuthority(who),
          date: null,
          location: null,
          verifiedBy: who,
          sourceType: "web",
        };
      });
      return { connectorId: this.id, claims, rawHitCount: results.length };
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

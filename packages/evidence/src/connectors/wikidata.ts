/**
 * Wikidata SPARQL connector.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/arts-provenance-agent
 *   (src/tools/wikidata.ts — lookupProvenance, fetchProvenanceEvents,
 *   findEntity, PROVENANCE_PROPERTIES, RISK_EVENT_RE).
 *   The SPARQL query, property list, risk regex, scoring heuristic, and
 *   "leads to verify, never findings" caveat are preserved verbatim.
 *   See docs/DECISIONS.md#adr-008.
 */
import type {
  EvidenceConnector,
  EvidenceQuery,
  EvidenceResult,
  EvidenceClaim,
  ConnectorContext,
} from "../types.js";

const WD_API = "https://www.wikidata.org/w/api.php";
const WD_SPARQL = "https://query.wikidata.org/sparql";
const UA =
  "dpa-evidence/0.4 (https://github.com/Ethical-Tech-CoLab/DPA)";
const TIMEOUT_MS = 8000;

const PROVENANCE_PROPERTIES = [
  "P793", // significant event
  "P170", // creator
  "P195", // collection
  "P495", // country of origin
  "P189", // location of discovery
  "P1071", // location of creation
  "P276", // current location
  "P571", // inception
] as const;

const RISK_EVENT_RE =
  /(loot|theft|stolen|restitut|repatriat|confiscat|seiz|spoliat|plunder|illicit|smuggl|erroneous provenance|\bnazi(?:s|sm|-era)?\b)/i;

interface WdCandidate {
  qid: string;
  label: string;
  description: string;
}

interface WdEvent {
  property: string;
  value: string;
  date: string | null;
  reference: string | null;
  riskRelevant: boolean;
}

function withTimeout(
  ms: number,
  fetchImpl: typeof globalThis.fetch,
): { signal: AbortSignal; done: () => void } {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  void fetchImpl; // fetchImpl signal is passed separately; this just gives us the AbortSignal
  return { signal: ctl.signal, done: () => clearTimeout(t) };
}

async function searchLabels(
  query: string,
  fetchImpl: typeof globalThis.fetch,
): Promise<WdCandidate[]> {
  const { signal, done } = withTimeout(TIMEOUT_MS, fetchImpl);
  try {
    const url = new URL(WD_API);
    url.searchParams.set("action", "wbsearchentities");
    url.searchParams.set("search", query);
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "10");
    url.searchParams.set("origin", "*");
    const res = await fetchImpl(url.toString(), {
      headers: { "User-Agent": UA },
      signal,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      search?: Array<{
        id: string;
        label?: string;
        description?: string;
      }>;
    };
    return (data.search ?? []).map((h) => ({
      qid: h.id,
      label: h.label ?? query,
      description: h.description ?? "",
    }));
  } catch {
    return [];
  } finally {
    done();
  }
}

async function fetchProvenanceEvents(
  qid: string,
  fetchImpl: typeof globalThis.fetch,
): Promise<WdEvent[]> {
  const query = `
SELECT ?propLabel ?valLabel ?when ?ref WHERE {
  VALUES ?item { wd:${qid} }
  VALUES ?prop { ${PROVENANCE_PROPERTIES.map((p) => `wd:${p}`).join(" ")} }
  ?prop wikibase:claim ?p ; wikibase:statementProperty ?ps ; rdfs:label ?propLabel .
  FILTER(LANG(?propLabel) = "en")
  ?item ?p ?statement .
  ?statement ?ps ?val .
  OPTIONAL { ?statement pq:P585 ?when }
  OPTIONAL { ?statement prov:wasDerivedFrom/pr:P854 ?ref }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}
LIMIT 40`;

  const { signal, done } = withTimeout(TIMEOUT_MS, fetchImpl);
  try {
    const url = new URL(WD_SPARQL);
    url.searchParams.set("query", query);
    const res = await fetchImpl(url.toString(), {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": UA,
      },
      signal,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      results?: {
        bindings?: Array<Record<string, { value: string } | undefined>>;
      };
    };
    const seen = new Set<string>();
    const events: WdEvent[] = [];
    for (const b of data.results?.bindings ?? []) {
      const property = b["propLabel"]?.value ?? "";
      const value = b["valLabel"]?.value ?? "";
      if (!property || !value) continue;
      if (/^https?:\/\//i.test(value)) continue;
      const key = `${property}|${value}|${b["when"]?.value ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      events.push({
        property,
        value,
        date: b["when"]?.value ?? null,
        reference: b["ref"]?.value ?? null,
        riskRelevant: RISK_EVENT_RE.test(value),
      });
    }
    return events.sort((a, b) => Number(b.riskRelevant) - Number(a.riskRelevant));
  } catch {
    return [];
  } finally {
    done();
  }
}

function scoreCandidate(events: WdEvent[], artist?: string): number {
  const base =
    events.filter((e) => e.riskRelevant).length * 10 + events.length;
  if (!artist) return base;
  const creators = events
    .filter((e) => e.property === "creator")
    .map((e) => e.value.toLowerCase());
  if (!creators.length) return base;
  const surname = artist.trim().toLowerCase().split(/\s+/).pop() ?? "";
  const agrees =
    surname.length > 2 && creators.some((c) => c.includes(surname));
  return agrees ? base + 1000 : base - 1000;
}

/** Minimal fixture. */
const FIXTURES: EvidenceClaim[] = [
  {
    text: "Fixture: Wikidata search unavailable in fixtures mode.",
    sourceUrl: "https://www.wikidata.org",
    sourceTitle: "Wikidata (fixtures fallback)",
    tier: "inferred",
    date: null,
    location: null,
    verifiedBy: "Wikidata contributors",
    sourceType: "structured-api",
  },
];

export class WikidataConnector implements EvidenceConnector {
  readonly id = "wikidata";
  readonly name = "Wikidata (structured provenance events)";
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

    try {
      // Find candidates
      const title = q.title;
      const artist = q.artist;
      const stripped = title.replace(/\s*\([^)]*\)\s*/g, " ").trim();
      const queries = [
        artist ? `${title} ${artist}` : "",
        title,
        stripped,
      ].filter((x, i, arr) => x && arr.indexOf(x) === i);

      let hits: WdCandidate[] = [];
      for (const query of queries) {
        hits = await searchLabels(query, fetchImpl);
        if (hits.length) break;
      }
      if (!hits.length) {
        return { connectorId: this.id, claims: [], rawHitCount: 0 };
      }

      // Apply artist filter before resolving
      const surname = artist?.trim().toLowerCase().split(/\s+/).pop() ?? "";
      if (surname.length > 2) {
        const byArtist = hits.filter((h) =>
          h.description.toLowerCase().includes(surname),
        );
        if (byArtist.length) hits = byArtist.slice(0, 3);
      } else {
        hits = hits.slice(0, 3);
      }

      // Resolve events for each candidate and pick best
      const resolved = await Promise.all(
        hits.map(async (c) => ({
          c,
          events: await fetchProvenanceEvents(c.qid, fetchImpl),
        })),
      );
      const best = resolved.reduce((a, b) =>
        scoreCandidate(b.events, artist) > scoreCandidate(a.events, artist)
          ? b
          : a,
      );

      const entityUrl = `https://www.wikidata.org/wiki/${best.c.qid}`;
      const claims: EvidenceClaim[] = best.events.map((e) => ({
        text: `${e.property}: ${e.value}${e.date ? ` (${e.date.slice(0, 10)})` : ""}`,
        sourceUrl: e.reference ?? entityUrl,
        sourceTitle: `Wikidata ${best.c.qid} — ${best.c.label}`,
        // Wikidata is community-maintained — never verifiedByAuthority
        tier: "reportedInPress" as const,
        date: e.date,
        location: null,
        verifiedBy: "Wikidata contributors — community-maintained, not an authority",
        sourceType: "structured-api",
      }));

      return {
        connectorId: this.id,
        claims,
        rawHitCount: best.events.length,
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

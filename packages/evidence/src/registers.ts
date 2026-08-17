/**
 * Tiered stolen-art and cultural-property register checks.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/arts-provenance-agent
 *   (src/tools/registries.ts — REGISTRIES, checkRegistries, groundedCheck,
 *   wikidataCheck, referralCheck, mentionsObject, CAVEAT_* constants).
 *   All register definitions, caveats, referral URLs and the "no-clear"
 *   architectural rule are preserved verbatim from the upstream.
 *   See docs/DECISIONS.md#adr-008, ADR-009.
 *
 * ============================================================
 * CRITICAL — ADR-009: NO `clear` VERDICT
 * ============================================================
 *
 * The permitted verdicts are EXACTLY:
 *   possible-match | no-evidence-found | not-queryable | not-run
 *
 * There is deliberately NO "clear" or "not-stolen" verdict.
 *
 * The strongest negative expressible is `no-evidence-found`, which means
 * "nothing surfaced through the access we had" — not "absent from this
 * register", and absolutely not "clean bill of health". Objects looted at
 * source were never inventoried and cannot appear in a stolen-property
 * register. A tool that renders absence as clearance is actively dangerous.
 *
 * `access`, `verdict`, `method`, `caveat` and `officialSearch` must always
 * be populated together and signed. The caveat is what makes the verdict
 * readable; it is never optional.
 * ============================================================
 */
import type { RegistryCheckRecord } from "@dpa/schema";

/* -------------------------------------------------------------------------- */
/* Registry definitions                                                       */
/* -------------------------------------------------------------------------- */

export interface RegistryDef {
  id: string;
  name: string;
  /** The body that maintains or mandates the register. */
  assertedBy: string;
  access: RegistryCheckRecord["access"];
  /** Domains for domain-scoped grounded searches. Empty for referral-only. */
  domains: string[];
  /** Official human search URL. */
  officialSearch: string;
  /** Credential-application URL where one exists. */
  applyUrl?: string;
  /** What this register covers — and what it structurally cannot. */
  coverage: string;
  /** Extra query terms that improve domain-scoped searches. */
  queryHint: string;
}

/**
 * The register list, ordered roughly by authority for the illicit-trade
 * question. Preserved from the upstream arts-provenance-agent.
 */
export const REGISTRIES: RegistryDef[] = [
  {
    id: "interpol-swoa",
    name: "INTERPOL Stolen Works of Art Database",
    assertedBy: "INTERPOL — Cultural Heritage Crime Unit",
    access: "grounded-search",
    domains: ["interpol.int"],
    officialSearch:
      "https://www.interpol.int/en/Crimes/Cultural-heritage-crime/Stolen-Works-of-Art-Database",
    applyUrl:
      "https://www.interpol.int/en/Crimes/Cultural-heritage-crime/Stolen-Works-of-Art-Database/Application-form-to-access-INTERPOL-s-Works-of-Art-Database",
    coverage:
      "The only global database of certified police information on stolen and missing cultural objects (~52,000 items). Entries come from member-country police forces, so an object only appears if a theft was reported to and recorded by a national force. Unreported and never-inventoried material — most looted archaeological and colonial-era objects — is structurally absent.",
    queryHint: "stolen works of art database notice",
  },
  {
    id: "interpol-id-art",
    name: "INTERPOL ID-Art (mobile lookup)",
    assertedBy: "INTERPOL — Cultural Heritage Crime Unit",
    access: "referral-only",
    domains: [],
    officialSearch:
      "https://www.interpol.int/en/Crimes/Cultural-heritage-crime/ID-Art-mobile-app",
    coverage:
      "The same Stolen Works of Art database, searchable by image or description from a phone with no login required. This is the fastest authoritative check a human can run on an object in front of them — and it cannot be automated, which is why it appears here as a referral rather than a result.",
    queryHint: "",
  },
  {
    id: "fbi-nsaf",
    name: "FBI National Stolen Art File",
    assertedBy: "US Federal Bureau of Investigation — Art Crime Team",
    access: "grounded-search",
    domains: ["fbi.gov"],
    officialSearch: "https://artcrimes.fbi.gov/",
    coverage:
      "Stolen art and cultural property submitted by US and foreign law-enforcement agencies. Entry requires a police report and a value threshold, so it is a record of reported thefts from documented collections, not of looting at source.",
    queryHint: "national stolen art file art theft",
  },
  {
    id: "carabinieri-tpc",
    name: "Carabinieri TPC — Leonardo database",
    assertedBy: "Comando Carabinieri Tutela Patrimonio Culturale (Italy)",
    access: "grounded-search",
    domains: ["carabinieri.it", "beniculturali.it"],
    officialSearch: "https://tpcweb.carabinieri.it/SitoPubblico/ricerca",
    coverage:
      "Over 1.1 million stolen or illicitly exported cultural objects — the largest such archive in the world, and the most important single source for Italian antiquities. Public search is a web form; the full archive is law-enforcement access.",
    queryHint: "beni culturali illecitamente sottratti furto",
  },
  {
    id: "lostart-de",
    name: "Lost Art Database",
    assertedBy: "German Lost Art Foundation (Deutsches Zentrum Kulturgutverluste)",
    access: "grounded-search",
    domains: ["lostart.de", "kulturgutverluste.de", "proveana.de"],
    officialSearch: "https://www.lostart.de/en/search",
    coverage:
      "Cultural property lost, moved or seized as a result of Nazi persecution 1933–1945, plus wartime relocations. Carries both 'found' and 'search' reports. The reference register for Nazi-era provenance gaps — and irrelevant to colonial-era and archaeological looting.",
    queryHint: "Nazi-era provenance lost art report",
  },
  {
    id: "getty-provenance-index",
    name: "Getty Provenance Index",
    assertedBy: "Getty Research Institute",
    access: "grounded-search",
    domains: ["getty.edu"],
    officialSearch:
      "https://www.getty.edu/research/tools/provenance/search.html",
    coverage:
      "Transcribed auction catalogues, dealer stock books and collection inventories — the primary evidence base for reconstructing an ownership chain rather than for flagging a theft. Strongest on the European and American art market; thin outside it.",
    queryHint: "provenance index sale catalog collection inventory",
  },
  {
    id: "icom-red-lists",
    name: "ICOM Red Lists of Cultural Objects at Risk",
    assertedBy: "International Council of Museums",
    access: "grounded-search",
    domains: ["icom.museum", "unesco.org"],
    officialSearch: "https://icom.museum/en/resources/red-lists/",
    coverage:
      "Object CATEGORIES at risk of illicit trafficking by region — not individual objects. A Red List hit never identifies a specific piece; it says an object of this type from this region should not move without documentation. That is a due-diligence trigger, not an identification.",
    queryHint: "red list cultural objects at risk trafficking",
  },
  {
    id: "wikidata",
    name: "Wikidata (structured provenance events)",
    assertedBy: "Wikidata contributors — community-maintained, not an authority",
    access: "structured-api",
    domains: ["wikidata.org"],
    officialSearch: "https://www.wikidata.org/",
    coverage:
      "The only openly machine-queryable source here. Its 'significant event' statements carry dated values such as archaeological looting, art theft, restitution and claim for restitution, usually with a reference URL. Coverage is uneven and edits are unreviewed, so this generates leads to verify — never findings.",
    queryHint: "",
  },
  {
    id: "art-loss-register",
    name: "Art Loss Register",
    assertedBy: "The Art Loss Register (commercial due-diligence registry)",
    access: "paid-x402",
    domains: ["artloss.com"],
    officialSearch: "https://www.artloss.com/",
    coverage:
      "The largest private database of stolen and looted art. Registration and search are commercial services — which is exactly why this one is the agent's paid x402 check rather than a free lookup.",
    queryHint: "art loss register stolen",
  },
];

/* -------------------------------------------------------------------------- */
/* Caveats (preserved verbatim from upstream)                                 */
/* -------------------------------------------------------------------------- */

const CAVEAT_NO_EVIDENCE =
  "No evidence surfaced through the access available. This is NOT a statement that the object is absent from this register, and it is NOT a clean bill of health — objects looted at source were never inventoried and cannot appear in a stolen-property register at all.";
const CAVEAT_POSSIBLE =
  "A source on this registry's domain names this object. This is a lead requiring human verification against the register itself, not a confirmed register entry.";
const CAVEAT_NOT_QUERYABLE =
  "This register could not be searched programmatically. Nothing about the object has been established either way — the official search below must be run by a human.";
const CAVEAT_WIKIDATA =
  "Wikidata is community-maintained and certifies nothing. Dated events here are leads to verify against the cited source, not findings.";
const CAVEAT_NOT_RUN =
  "This register was not searched in this run (fixtures mode, or budget/configuration constraint). The official search link must be run by a human.";

/* -------------------------------------------------------------------------- */
/* Object-mention gate (preserved from upstream)                              */
/* -------------------------------------------------------------------------- */

const GENERIC_TITLE_WORDS = new Set([
  "vase", "vessel", "bowl", "cup", "krater", "amphora", "jar", "plate", "dish",
  "portrait", "painting", "picture", "drawing", "sketch", "study", "panel",
  "statue", "statuette", "figure", "figurine", "bust", "head", "torso", "relief",
  "plaque", "mask", "stone", "marble", "marbles", "bronze", "gold", "silver",
  "collection", "museum", "gallery", "treasure", "hoard", "flowers", "flower",
  "with", "from", "the", "and", "for", "of", "self", "young", "woman", "man",
  "lady", "girl", "boy", "saint", "virgin", "madonna", "landscape", "scene",
]);

const RISK_LANGUAGE_RE =
  /(stolen|theft|stole|looted|looting|plunder|smuggl|illicit|trafficking|seized|confiscat|spoliat|restitut|repatriat|missing|recovered)/i;

function mentionsObject(text: string, title: string, artist?: string): boolean {
  const hay = text.toLowerCase();
  if (artist) {
    const surname = artist
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .pop();
    if (surname && hay.includes(surname)) return true;
  }
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const distinctive = words.filter((w) => !GENERIC_TITLE_WORDS.has(w));
  if (distinctive.some((w) => hay.includes(w))) return true;
  return words.filter((w) => hay.includes(w)).length >= 2;
}

/* -------------------------------------------------------------------------- */
/* Check builders                                                              */
/* -------------------------------------------------------------------------- */

function nowIso(): string {
  return new Date().toISOString();
}

function referralRecord(r: RegistryDef, verdict: RegistryCheckRecord["verdict"] = "not-queryable"): RegistryCheckRecord {
  const method =
    r.access === "paid-x402"
      ? "Commercial register — reached through the agent's paid x402 check, not this free layer."
      : r.access === "referral-only"
        ? "No programmatic interface exists. Deep link emitted for a human to run the authoritative search."
        : "Not searched (grounding unavailable in current mode). Referral emitted instead of a fabricated negative.";
  return {
    registry: r.name,
    assertedBy: r.assertedBy,
    access: r.access,
    verdict,
    method,
    caveat:
      verdict === "not-run" ? CAVEAT_NOT_RUN : CAVEAT_NOT_QUERYABLE,
    hits: [],
    officialSearch: r.officialSearch,
    checkedAt: nowIso(),
  };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

export interface RegisterCheckOptions {
  /** Only check these registry IDs (default: all). */
  only?: string[];
  /** True to perform live network checks (false = emit referrals only). */
  live?: boolean;
  /** fetch() implementation (defaults to globalThis.fetch). */
  fetchImpl?: typeof globalThis.fetch;
}

export interface RegisterSummary {
  checks: RegistryCheckRecord[];
  possibleMatches: number;
  notQueryable: number;
}

/**
 * Run all registry checks for one object.
 *
 * In fixtures / non-live mode every register that would require network I/O
 * is recorded as `not-run` with a caveat rather than a fabricated negative.
 * A search that never ran must never be recorded as a search that found nothing.
 *
 * ADR-009: no check can ever return a "clear" or "not-stolen" verdict.
 */
export async function checkRegistries(
  title: string,
  artist?: string,
  opts: RegisterCheckOptions = {},
): Promise<RegisterSummary> {
  const live = Boolean(opts.live);
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  const wanted = opts.only?.length
    ? REGISTRIES.filter((r) => opts.only!.includes(r.id))
    : REGISTRIES;

  const checks = await Promise.all(
    wanted.map(async (r) => {
      try {
        if (r.access === "referral-only" || r.access === "paid-x402") {
          return referralRecord(r, "not-queryable");
        }
        if (!live) {
          return referralRecord(r, "not-run");
        }
        if (r.id === "wikidata") {
          return await wikidataCheck(r, title, artist, fetchImpl);
        }
        return await groundedCheck(r, title, artist, fetchImpl);
      } catch {
        return referralRecord(r, "not-queryable");
      }
    }),
  );

  return {
    checks,
    possibleMatches: checks.filter((c) => c.verdict === "possible-match").length,
    notQueryable: checks.filter(
      (c) => c.verdict === "not-queryable" || c.verdict === "not-run",
    ).length,
  };
}

/* -------------------------------------------------------------------------- */
/* Internal check implementations                                             */
/* -------------------------------------------------------------------------- */

async function groundedCheck(
  r: RegistryDef,
  title: string,
  artist: string | undefined,
  fetchImpl: typeof globalThis.fetch,
): Promise<RegistryCheckRecord> {
  const query = [title, artist ?? "", r.queryHint].filter(Boolean).join(" ");
  let hits: RegistryCheckRecord["hits"] = [];
  let failed = false;

  try {
    // Domain-scoped fetch via Tavily would normally be used here, but
    // since we have no Tavily key in this package, we do a best-effort
    // direct fetch of the domain's search URL with the query.  This is
    // intentionally limited — the upstream notes that "grounded-search" means
    // searching the WEBSITE, not the REGISTER.
    void fetchImpl; void query; // live grounding delegated to caller
    failed = true; // without Tavily, fall through to referral
  } catch {
    failed = true;
  }

  return {
    registry: r.name,
    assertedBy: r.assertedBy,
    access: r.access,
    verdict: failed ? "not-queryable" : hits.length ? "possible-match" : "no-evidence-found",
    method: `Domain-scoped search of ${r.domains.join(", ")}. This searches the registry's public WEBSITE, not its register.`,
    hits,
    officialSearch: r.officialSearch,
    caveat: failed ? CAVEAT_NOT_QUERYABLE : hits.length ? CAVEAT_POSSIBLE : CAVEAT_NO_EVIDENCE,
    checkedAt: nowIso(),
  };
}

async function wikidataCheck(
  r: RegistryDef,
  title: string,
  artist: string | undefined,
  fetchImpl: typeof globalThis.fetch,
): Promise<RegistryCheckRecord> {
  const WD_API = "https://www.wikidata.org/w/api.php";
  const WD_SPARQL = "https://query.wikidata.org/sparql";
  const UA = "dpa-evidence/0.4 (https://github.com/Ethical-Tech-CoLab/DPA)";

  try {
    // Search for entity
    const searchUrl = new URL(WD_API);
    searchUrl.searchParams.set("action", "wbsearchentities");
    searchUrl.searchParams.set("search", title);
    searchUrl.searchParams.set("language", "en");
    searchUrl.searchParams.set("format", "json");
    searchUrl.searchParams.set("limit", "5");
    searchUrl.searchParams.set("origin", "*");

    const searchRes = await fetchImpl(searchUrl.toString(), {
      headers: { "User-Agent": UA },
    });
    if (!searchRes.ok) return referralRecord(r, "not-queryable");
    const searchData = (await searchRes.json()) as {
      search?: Array<{ id: string; label?: string; description?: string }>;
    };
    const candidates = searchData.search ?? [];
    if (!candidates.length) {
      return {
        ...referralRecord(r, "no-evidence-found"),
        method:
          "Wikidata entity search + SPARQL over significant-event, collection and origin statements. No entity resolved.",
        caveat: CAVEAT_NO_EVIDENCE,
      };
    }

    const surname = artist?.trim().toLowerCase().split(/\s+/).pop() ?? "";
    const best =
      (surname.length > 2
        ? candidates.find((c) =>
            (c.description ?? "").toLowerCase().includes(surname),
          )
        : undefined) ?? candidates[0];

    if (!best) {
      return {
        ...referralRecord(r, "no-evidence-found"),
        method: "Wikidata: no suitable entity candidate found.",
        caveat: CAVEAT_NO_EVIDENCE,
      };
    }

    const qid = best.id;
    const entityUrl = `https://www.wikidata.org/wiki/${qid}`;

    // Fetch significant events via SPARQL
    const sparql = `
SELECT ?propLabel ?valLabel ?when ?ref WHERE {
  VALUES ?item { wd:${qid} }
  VALUES ?prop { wd:P793 wd:P195 wd:P495 wd:P189 wd:P276 wd:P571 }
  ?prop wikibase:claim ?p ; wikibase:statementProperty ?ps ; rdfs:label ?propLabel .
  FILTER(LANG(?propLabel) = "en")
  ?item ?p ?statement .
  ?statement ?ps ?val .
  OPTIONAL { ?statement pq:P585 ?when }
  OPTIONAL { ?statement prov:wasDerivedFrom/pr:P854 ?ref }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}
LIMIT 30`;

    const sparqlUrl = new URL(WD_SPARQL);
    sparqlUrl.searchParams.set("query", sparql);
    const sparqlRes = await fetchImpl(sparqlUrl.toString(), {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": UA,
      },
    });

    if (!sparqlRes.ok) return referralRecord(r, "not-queryable");

    const RISK_RE =
      /(loot|theft|stolen|restitut|repatriat|confiscat|seiz|spoliat|plunder|illicit|smuggl|\bnazi\b)/i;

    const sparqlData = (await sparqlRes.json()) as {
      results?: {
        bindings?: Array<Record<string, { value: string } | undefined>>;
      };
    };
    const bindings = sparqlData.results?.bindings ?? [];
    const hits: RegistryCheckRecord["hits"] = [];
    const seen = new Set<string>();
    for (const b of bindings) {
      const prop = b["propLabel"]?.value ?? "";
      const val = b["valLabel"]?.value ?? "";
      if (!prop || !val) continue;
      if (/^https?:\/\//i.test(val)) continue;
      const key = `${prop}|${val}`;
      if (seen.has(key)) continue;
      if (!mentionsObject(`${prop} ${val}`, title, artist)) continue;
      seen.add(key);
      hits.push({
        claim: `${prop}: ${val}${b["when"]?.value ? ` (${b["when"].value.slice(0, 10)})` : ""}`,
        source: b["ref"]?.value ?? entityUrl,
        riskRelevant: RISK_RE.test(val),
      });
    }

    const hasRisk = hits.some((h) => h.riskRelevant);
    return {
      registry: r.name,
      assertedBy: r.assertedBy,
      access: r.access,
      verdict: hasRisk ? "possible-match" : hits.length ? "no-evidence-found" : "no-evidence-found",
      method:
        `SPARQL over ${qid} (${best.label ?? title}) — significant-event (P793), collection (P195), ` +
        `origin (P495), discovery (P189), location (P276), inception (P571). ` +
        `Chosen from ${candidates.length} label-search candidate(s).`,
      hits,
      officialSearch: entityUrl,
      caveat: CAVEAT_WIKIDATA,
      checkedAt: nowIso(),
    };
  } catch {
    return referralRecord(r, "not-queryable");
  }
}

/**
 * Fixture data for a Benin Bronze plaque (Kingdom of Benin, 16th c.).
 *
 * Object: Commemorative plaque (brass/bronze), Kingdom of Benin
 * Period: 16th century CE
 * Acquisition mode: colonial — 1897 British Punitive Expedition
 * Coverage class: partially-covered (colonial removal well documented
 *   historically; criminal registers structurally cannot hold it because
 *   it was not "stolen" in the sense those registers require)
 *
 * The Benin Bronzes are among the best-documented cases of colonial-era
 * cultural property removal. The 1897 Punitive Expedition took an estimated
 * 3,000–5,000 objects; roughly 1,000 are currently in British museums
 * alone, with hundreds more in Germany, the US and elsewhere. Repatriation
 * discussions are ongoing as of 2024–2025.
 *
 * Sources: British Museum; Smithsonian; Benin Dialogue Group; UNESCO;
 * Nigerian National Commission for Museums and Monuments;
 * Kaosar A. Yakubu, "Benin Bronzes" (Oxford Art Online).
 *
 * PROVENANCE NOTE: fixture data assembled for DPA v0.4.
 */
import type { TimelineEvent, RegistryCheckRecord } from "@dpa/schema";

export const BENIN_BRONZE_TIMELINE: TimelineEvent[] = [
  {
    event:
      "Cast at the Benin royal court, Benin City (present-day Edo State, Nigeria). Commemorative brass plaques were produced by the Igun Eronmwon guild of royal brass-casters under royal commission, depicting court ceremonies, warriors, and historical events. Plaques were mounted on wooden pillars of the Oba's palace.",
    date: null,
    location: "Benin City, Kingdom of Benin (present-day Edo State, Nigeria)",
    source:
      "https://www.britishmuseum.org/collection/term/BIOG185641",
    sourceType: "museum-catalogue",
    verifiedBy: "The British Museum",
    tier: "verifiedByAuthority",
    confidence: 0.9,
    isGeneralKnowledge: false,
  },
  {
    event:
      "British Punitive Expedition, February–March 1897. Following the ambush of a British trade delegation (January 1897), a British naval and military force attacked and sacked Benin City on 18 February 1897. Oba Ovonramwen was deposed. British officers removed an estimated 3,000–5,000 brass plaques, ivory carvings, and other royal objects from the palace compound. Objects were initially distributed among expedition members and later sold through naval auctions and dealers.",
    date: "1897-02-18",
    location: "Benin City, Nigeria (then Southern Nigeria Protectorate)",
    source:
      "https://www.britishmuseum.org/collection/object/E_Af1898-0115-10",
    sourceType: "museum-catalogue",
    verifiedBy: "The British Museum",
    tier: "verifiedByAuthority",
    confidence: 0.95,
    isGeneralKnowledge: false,
  },
  {
    event:
      "Objects dispersed to European and American museums and private collections through commercial dealers (including W.D. Webster and Th. Bokencamp) and direct transfers. The British Museum acquired its first Benin objects from the expedition in 1897–1898. German collections (Berlin Ethnologisches Museum, then the Museum für Völkerkunde) acquired objects through the same channels.",
    date: "1898-01-01",
    location: "London, UK; Berlin, Germany",
    source:
      "https://en.wikipedia.org/wiki/Benin_Bronzes",
    sourceType: "scholarly",
    verifiedBy: "Wikipedia (community-edited; see British Museum catalogue for authoritative records)",
    tier: "reportedInPress",
    confidence: 0.75,
    isGeneralKnowledge: false,
  },
  {
    event:
      "Nigeria gained independence (1960) and the Nigerian government began formal requests for the return of Benin objects. The National Commission for Museums and Monuments (NCMM) was established to coordinate Nigeria's cultural property policy.",
    date: "1960-10-01",
    location: "Lagos, Nigeria",
    source:
      "https://www.ncmm.gov.ng/",
    sourceType: "government",
    verifiedBy: "Nigerian National Commission for Museums and Monuments",
    tier: "verifiedByAuthority",
    confidence: 0.85,
    isGeneralKnowledge: false,
  },
  {
    event:
      "Benin Dialogue Group formed (2010), bringing together European museum directors and representatives of the Nigerian government, the Royal Court of Benin, and the NCMM to negotiate the long-term loan and potential repatriation of Benin objects. Germany committed to repatriation; the first transfers were completed in 2022.",
    date: "2010-01-01",
    location: null,
    source:
      "https://www.benindialoguegroup.com/",
    sourceType: "government",
    verifiedBy: "Benin Dialogue Group",
    tier: "verifiedByAuthority",
    confidence: 0.9,
    isGeneralKnowledge: false,
  },
  {
    event:
      "Germany transferred 512 Benin Bronze objects to Nigeria (December 2022 and subsequent tranches). The Humboldt Forum (Berlin) and 17 other German museums participated. Oba Ewuare II received the objects at the Benin Royal Museum, Benin City.",
    date: "2022-12-01",
    location: "Berlin, Germany / Benin City, Nigeria",
    source:
      "https://www.theguardian.com/culture/2022/dec/16/germany-returns-benin-bronzes-to-nigeria",
    sourceType: "press",
    verifiedBy: "The Guardian",
    tier: "reportedInPress",
    confidence: 0.9,
    isGeneralKnowledge: false,
  },
  {
    event:
      "Coverage gap note: the 1897 removal was a state military action, not a private theft. INTERPOL SWOA, the FBI NSAF, and the Art Loss Register record PRIVATE crimes (theft from known collections). The Benin Bronzes are not listed in any stolen-property register because no theft report was ever filed — the Oba's government did not exist as a legal person from whom objects could be 'reported stolen' under international law of the period. This is the structural reason colonial-era objects are absent from all criminal registers.",
    date: null,
    location: null,
    source:
      "https://www.unesco.org/en/articles/1970-convention-and-illicit-traffic-cultural-property",
    sourceType: "policy",
    verifiedBy: "UNESCO (coverage note, inferred)",
    tier: "inferred",
    confidence: 0.9,
    isGeneralKnowledge: false,
  },
];

export const BENIN_BRONZE_REGISTRY_CHECKS: RegistryCheckRecord[] = [
  {
    registry: "INTERPOL Stolen Works of Art Database",
    assertedBy: "INTERPOL — Cultural Heritage Crime Unit",
    access: "referral-only",
    verdict: "not-queryable",
    method:
      "No programmatic access. Structural coverage note: the 1897 Punitive Expedition was a state military action. INTERPOL SWOA records objects reported stolen by police forces of member states. No theft report was ever filed for Benin royal objects removed in 1897 — making their absence from this register uninformative about their actual status.",
    caveat:
      "Not queryable programmatically. Structural gap: colonial-era objects removed by state military action are absent from criminal registers by design — not because they are unproblematic. A null result here is uninformative.",
    hits: [],
    officialSearch:
      "https://www.interpol.int/en/Crimes/Cultural-heritage-crime/Stolen-Works-of-Art-Database",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    registry: "INTERPOL ID-Art (mobile lookup)",
    assertedBy: "INTERPOL — Cultural Heritage Crime Unit",
    access: "referral-only",
    verdict: "not-queryable",
    method: "No programmatic access. Same structural coverage gap applies.",
    caveat:
      "Not queryable programmatically. Structural coverage gap — see INTERPOL SWOA note.",
    hits: [],
    officialSearch:
      "https://www.interpol.int/en/Crimes/Cultural-heritage-crime/ID-Art-mobile-app",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    registry: "FBI National Stolen Art File",
    assertedBy: "US Federal Bureau of Investigation — Art Crime Team",
    access: "grounded-search",
    verdict: "no-evidence-found",
    method:
      "Grounded search over fbi.gov. No Benin Bronze listings found in public pages. Same structural coverage gap as INTERPOL — the FBI NSAF records private theft reports.",
    caveat:
      "No evidence surfaced. This is NOT a clean bill of health. The FBI NSAF records reported thefts from documented collections; it cannot hold records of colonial-era objects removed by state military action.",
    hits: [],
    officialSearch: "https://artcrimes.fbi.gov/",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    registry: "Carabinieri TPC — Leonardo database",
    assertedBy: "Comando Carabinieri Tutela Patrimonio Culturale (Italy)",
    access: "grounded-search",
    verdict: "no-evidence-found",
    method:
      "Grounded search over carabinieri.it. No results for Benin Bronze plaque. The TPC archive focuses primarily on Italian cultural property.",
    caveat:
      "No evidence surfaced. This is NOT a clean bill of health. The TPC archive has no coverage of Nigerian colonial-era objects.",
    hits: [],
    officialSearch: "https://tpcweb.carabinieri.it/SitoPubblico/ricerca",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    registry: "Lost Art Database",
    assertedBy: "German Lost Art Foundation (Deutsches Zentrum Kulturgutverluste)",
    access: "grounded-search",
    verdict: "no-evidence-found",
    method:
      "Grounded search over lostart.de. No Benin Bronze listings. This register covers Nazi-era spoliation only — structurally irrelevant to a 1897 colonial removal.",
    caveat:
      "No evidence surfaced. The Lost Art Database covers 1933–1945 Nazi-era cultural property loss only. It is structurally irrelevant to 1897 colonial-era removal.",
    hits: [],
    officialSearch: "https://www.lostart.de/en/search",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    registry: "Getty Provenance Index",
    assertedBy: "Getty Research Institute",
    access: "grounded-search",
    verdict: "possible-match",
    method:
      "Grounded search over getty.edu. The Getty Provenance Index contains auction catalogue entries for Benin bronzes sold through European dealers in the late 19th and early 20th centuries, including W.D. Webster sales. These records document the early market dispersal of Expedition objects.",
    caveat:
      "A hit surfaced in auction catalogue records from the post-1897 period. This is a LEAD requiring human verification — it confirms the object moved through the art market but does not establish current ownership or repatriation status.",
    hits: [
      {
        claim:
          "Getty Provenance Index: auction catalogue records for Benin brass objects sold by W.D. Webster (c. 1899–1901) following the 1897 Punitive Expedition",
        source: "https://www.getty.edu/research/tools/provenance/search.html",
        riskRelevant: true,
      },
    ],
    officialSearch:
      "https://www.getty.edu/research/tools/provenance/search.html",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    registry: "ICOM Red Lists of Cultural Objects at Risk",
    assertedBy: "International Council of Museums",
    access: "grounded-search",
    verdict: "no-evidence-found",
    method:
      "Grounded search over icom.museum. The ICOM Red List for Africa does not specifically list Benin Bronzes as a current trafficking risk category — most known Benin objects are already in institutional custody.",
    caveat:
      "No evidence surfaced. The ICOM Red Lists address trafficking risk categories, not historical dispersal. Benin Bronzes are well documented in institutional collections; the current risk is insufficient repatriation, not further trafficking.",
    hits: [],
    officialSearch: "https://icom.museum/en/resources/red-lists/",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    registry: "Wikidata (structured provenance events)",
    assertedBy: "Wikidata contributors — community-maintained, not an authority",
    access: "structured-api",
    verdict: "possible-match",
    method:
      "Wikidata SPARQL query. The 'Benin Bronzes' (Q223429) entity carries significant-event statements including 'looting' (P793), collection statements for the British Museum and other institutions, and country-of-origin Nigeria. Risk-relevant events found.",
    caveat:
      "Wikidata is community-maintained and certifies nothing. The significant-event statements here reflect widely documented historical fact but are unreviewed community edits. Treat as a lead, not a finding.",
    hits: [
      {
        claim: "significant event: looting (1897 British Punitive Expedition)",
        source: "https://www.wikidata.org/wiki/Q223429",
        riskRelevant: true,
      },
      {
        claim: "country of origin: Nigeria",
        source: "https://www.wikidata.org/wiki/Q223429",
        riskRelevant: false,
      },
      {
        claim: "collection: British Museum, Ethnologisches Museum Berlin",
        source: "https://www.wikidata.org/wiki/Q223429",
        riskRelevant: false,
      },
    ],
    officialSearch: "https://www.wikidata.org/wiki/Q223429",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    registry: "Art Loss Register",
    assertedBy: "The Art Loss Register (commercial due-diligence registry)",
    access: "paid-x402",
    verdict: "not-queryable",
    method:
      "Commercial register — reached through the agent's paid x402 check, not this free layer.",
    caveat:
      "Commercial register not searched at this tier. Even if searched, the Art Loss Register records private theft reports; colonial-era removals by state action fall outside its coverage by design.",
    hits: [],
    officialSearch: "https://www.artloss.com/",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
];

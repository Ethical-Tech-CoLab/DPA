/**
 * Fixture data for the Getty Bronze (Victorious Youth / Athlete of Fano).
 *
 * Object: Bronze statue of a victorious athlete
 * Artist: Unknown Greek sculptor (attributed to the circle of Lysippos)
 * Period: c. 300–100 BCE (Greek, late Classical or Hellenistic)
 * Current holder: J. Paul Getty Museum, Malibu, California
 * Acquisition mode: market-theft (raised from the sea by Italian fishermen,
 *   then illicitly exported before acquisition by Getty)
 * Coverage class: well-covered
 *
 * The Getty Bronze is one of the most contested antiquities in the world.
 * Italy has sought its return since the 1970s; US courts have consistently
 * upheld Getty's title; Italian courts convicted Getty officials in absentia.
 * The legal and political contest is ongoing as of 2025.
 *
 * Sources: Getty Museum; Italian Ministry of Culture; New York Times;
 * Los Angeles Times; Wikidata Q390741; court records.
 *
 * PROVENANCE NOTE: fixture data assembled for DPA v0.4.
 */
import type { TimelineEvent, RegistryCheckRecord } from "@dpa/schema";

export const GETTY_BRONZE_TIMELINE: TimelineEvent[] = [
  {
    event:
      "Created by an unknown Greek sculptor, probably in the late 4th or early 3rd century BCE. The statue depicts a young male athlete — possibly a victorious pentathlete — in a pose associated with the victor's crown. Attribution to the circle of Lysippos has been proposed based on stylistic analysis.",
    date: null,
    location: "Greece or Magna Graecia (exact findspot unknown)",
    source:
      "https://www.getty.edu/art/collection/object/103OZS",
    sourceType: "museum-catalogue",
    verifiedBy: "J. Paul Getty Museum",
    tier: "verifiedByAuthority",
    confidence: 0.8,
    isGeneralKnowledge: false,
  },
  {
    event:
      "Discovered by Italian fishermen from Fano (Pesaro e Urbino province, Marche region) in their nets in international waters of the Adriatic Sea, approximately 1964–1965. The fishermen reportedly concealed the statue, eventually selling it clandestinely.",
    date: "1964-01-01",
    location: "Adriatic Sea, near Fano, Italy",
    source:
      "https://en.wikipedia.org/wiki/Victorious_Youth",
    sourceType: "scholarly",
    verifiedBy: "Wikipedia (community-edited; cross-check with Getty and Italian court records)",
    tier: "reportedInPress",
    confidence: 0.7,
    isGeneralKnowledge: false,
  },
  {
    event:
      "Purchased by J. Paul Getty for the J. Paul Getty Museum, Malibu, in 1977 for approximately $3.95 million, reportedly through intermediaries including a Munich dealer. The statue had left Italy without an export permit. Italian authorities were not notified.",
    date: "1977-01-01",
    location: "Malibu, California, USA",
    source:
      "https://www.nytimes.com/2006/10/16/arts/16bronze.html",
    sourceType: "press",
    verifiedBy: "New York Times",
    tier: "reportedInPress",
    confidence: 0.85,
    isGeneralKnowledge: false,
  },
  {
    event:
      "Italian government filed formal request for return of the statue, asserting it is Italian cultural property under Law 364 of 1909 and the 1939 Bottai Law, because the object was found in Italian territorial or fishing waters. This claim has been contested on the ground that the fishermen found it in international waters.",
    date: "1979-01-01",
    location: null,
    source:
      "https://www.beniculturali.it/comunicato/il-bronzo-di-lisippo",
    sourceType: "government",
    verifiedBy: "Italian Ministry of Culture (Ministero della Cultura)",
    tier: "verifiedByAuthority",
    confidence: 0.9,
    isGeneralKnowledge: false,
  },
  {
    event:
      "Italian court in Pesaro convicted several parties in absentia (including an art dealer and, controversially, a Getty curator) for receiving stolen goods. The Pesaro court's jurisdiction was disputed. The conviction did not result in extradition or return of the statue.",
    date: "1989-01-01",
    location: "Pesaro, Italy",
    source:
      "https://www.latimes.com/archives/la-xpm-2010-jun-28-la-et-getty-bronze-20100628-story.html",
    sourceType: "press",
    verifiedBy: "Los Angeles Times",
    tier: "reportedInPress",
    confidence: 0.8,
    isGeneralKnowledge: false,
  },
  {
    event:
      "US Supreme Court declined to review the case (2007), leaving in place a California appellate ruling that California courts had jurisdiction but that Italy's claim under the National Stolen Property Act was time-barred.",
    date: "2007-01-01",
    location: "Washington DC, USA",
    source:
      "https://www.nytimes.com/2007/02/21/arts/design/21bronze.html",
    sourceType: "press",
    verifiedBy: "New York Times",
    tier: "reportedInPress",
    confidence: 0.85,
    isGeneralKnowledge: false,
  },
  {
    event:
      "As of 2025, the Getty Bronze remains at the J. Paul Getty Museum, Villa, Malibu. Italy continues formal repatriation requests. The Getty's position is that it acquired the work in good faith and that its provenance before 1977 is unclear. The dispute is a canonical case study in the law of cultural property and museum acquisition policy.",
    date: "2025-01-01",
    location: "J. Paul Getty Museum, Malibu, California, USA",
    source:
      "https://www.getty.edu/art/collection/object/103OZS",
    sourceType: "museum-catalogue",
    verifiedBy: "J. Paul Getty Museum",
    tier: "verifiedByAuthority",
    confidence: 0.95,
    isGeneralKnowledge: false,
  },
];

export const GETTY_BRONZE_REGISTRY_CHECKS: RegistryCheckRecord[] = [
  {
    registry: "INTERPOL Stolen Works of Art Database",
    assertedBy: "INTERPOL — Cultural Heritage Crime Unit",
    access: "grounded-search",
    verdict: "possible-match",
    method:
      "Grounded search over interpol.int for 'Getty Bronze Victorious Youth Lysippos athlete'. INTERPOL cultural heritage crime unit has published material on contested antiquities including this object in the context of Italian repatriation requests.",
    caveat:
      "A source on this registry's domain names this object. This is a lead requiring human verification against the register itself, not a confirmed register entry. The object's status in the SWOA database is unclear — Italy has pursued civil and diplomatic channels rather than criminal theft reports.",
    hits: [
      {
        claim:
          "INTERPOL cultural heritage crime unit has referenced the Getty Bronze in the context of Italian repatriation demands for illicitly exported antiquities",
        source:
          "https://www.interpol.int/en/Crimes/Cultural-heritage-crime",
        riskRelevant: true,
      },
    ],
    officialSearch:
      "https://www.interpol.int/en/Crimes/Cultural-heritage-crime/Stolen-Works-of-Art-Database",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    registry: "INTERPOL ID-Art (mobile lookup)",
    assertedBy: "INTERPOL — Cultural Heritage Crime Unit",
    access: "referral-only",
    verdict: "not-queryable",
    method: "No programmatic access. Human search recommended.",
    caveat:
      "Not queryable programmatically. The ID-Art app should be used for an in-person check if physical access to the object is available.",
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
      "Grounded search over fbi.gov for 'Getty Bronze athlete'. No direct listings found. The FBI NSAF focuses on criminally reported thefts; the Getty Bronze dispute is primarily a civil and diplomatic matter.",
    caveat:
      "No evidence surfaced. This is NOT a clean bill of health. The dispute over the Getty Bronze is a civil/diplomatic repatriation matter, not a criminal theft report, so it would not necessarily appear in the FBI NSAF.",
    hits: [],
    officialSearch: "https://artcrimes.fbi.gov/",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    registry: "Carabinieri TPC — Leonardo database",
    assertedBy: "Comando Carabinieri Tutela Patrimonio Culturale (Italy)",
    access: "grounded-search",
    verdict: "possible-match",
    method:
      "Grounded search over carabinieri.it and beniculturali.it for 'Bronzo di Lisippo Getty'. The Carabinieri TPC has published extensively on their repatriation demands for the Getty Bronze (known in Italy as the 'Bronzo di Lisippo' or 'Atleta Vittorioso di Fano').",
    caveat:
      "A source on this registry's domain names this object. This is a lead requiring human verification against the full TPC archive. The Carabinieri TPC has an active repatriation file on this object; the dispute is well documented.",
    hits: [
      {
        claim:
          "Carabinieri TPC has an active repatriation file for the 'Atleta Vittorioso di Fano' (Bronzo di Lisippo), held by the J. Paul Getty Museum",
        source: "https://www.carabinieri.it/in-vostro-aiuto/consigli/patrimonio-culturale",
        riskRelevant: true,
      },
    ],
    officialSearch: "https://tpcweb.carabinieri.it/SitoPubblico/ricerca",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    registry: "Lost Art Database",
    assertedBy: "German Lost Art Foundation (Deutsches Zentrum Kulturgutverluste)",
    access: "grounded-search",
    verdict: "no-evidence-found",
    method:
      "Grounded search over lostart.de. No results. This register covers Nazi-era spoliation — structurally irrelevant to an ancient bronze found in the Adriatic in the 1960s.",
    caveat:
      "No evidence surfaced. The Lost Art Database covers 1933–1945 Nazi-era cultural property loss only. It is structurally irrelevant to this object.",
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
      "Grounded search over getty.edu. The Getty Provenance Index and the Getty Museum's own collection records document the 1977 acquisition and earlier dealer chain.",
    caveat:
      "A source on the Getty domain names this object. The Getty Museum's own records are the authoritative source for post-1977 provenance; they document the acquisition but not the pre-1977 findspot and dealer chain, which remains disputed.",
    hits: [
      {
        claim:
          "J. Paul Getty Museum acquisition 1977: Victorious Youth (Athlete of Fano). Acquired through German dealer; pre-acquisition provenance disputed with Italy.",
        source: "https://www.getty.edu/art/collection/object/103OZS",
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
      "Grounded search over icom.museum. No specific mention of this object in Red List materials. The object is already in a major institutional collection; the risk addressed by Red Lists is trafficking, not civil repatriation disputes.",
    caveat:
      "No evidence surfaced. The ICOM Red Lists address ongoing trafficking risk by object category; they do not track individual objects in institutional custody.",
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
      "Wikidata entity Q390741 (Victorious Youth). Significant events include looting/illicit export signal and repatriation claim. Collection: Getty Museum. Country of origin: Italy (disputed, as findspot was potentially international waters).",
    caveat:
      "Wikidata is community-maintained and certifies nothing. The 'looting' and repatriation events here reflect widely reported facts but are community-edited. Treat as a lead to verify against court records and museum documentation.",
    hits: [
      {
        claim: "significant event: illicit export from Italy; repatriation claim by Italian government",
        source: "https://www.wikidata.org/wiki/Q390741",
        riskRelevant: true,
      },
      {
        claim: "collection: J. Paul Getty Museum (1977–present)",
        source: "https://www.wikidata.org/wiki/Q390741",
        riskRelevant: false,
      },
    ],
    officialSearch: "https://www.wikidata.org/wiki/Q390741",
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
      "Commercial register not searched at this tier. The ALR is a private theft register; the Getty Bronze dispute is an Italian state repatriation claim, not a private theft report, so its ALR status may be absent or indirect.",
    hits: [],
    officialSearch: "https://www.artloss.com/",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
];

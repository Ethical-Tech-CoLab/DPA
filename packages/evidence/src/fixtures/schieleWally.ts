/**
 * Fixture data for Egon Schiele, "Portrait of Wally" (1912).
 *
 * Object: "Portrait of Wally" (Bildnis Wally)
 * Artist: Egon Schiele (1890–1918)
 * Date: 1912
 * Medium: Oil on wood panel
 * Acquisition mode: nazi-era (forced transfer 1938 under Nazi persecution)
 * Current holder: Leopold Museum, Vienna (returned after 2010 settlement)
 * Coverage class: well-covered
 *
 * This is one of the most celebrated Nazi-era spoliation cases: Lea Bondi
 * Jaray, a Viennese art dealer, was forced under duress to transfer "Portrait
 * of Wally" to Friedrich Welz, a Nazi-affiliated dealer, in 1938 following
 * the annexation of Austria. The painting subsequently entered Austrian state
 * custody, then the Leopold Collection, before being seized by the New York
 * DA in 1997 during a loan to the MoMA. The decade-long legal dispute ended
 * with a $19 million settlement with the Bondi heirs in 2010.
 *
 * Sources: German Lost Art Foundation (Kulturgutverluste.de); Getty
 * Provenance Index; New York Times; US courts (2nd Circuit);
 * Wikidata Q7236082.
 *
 * PROVENANCE NOTE: fixture data assembled for DPA v0.4.
 */
import type { TimelineEvent, RegistryCheckRecord } from "@dpa/schema";

export const SCHIELE_WALLY_TIMELINE: TimelineEvent[] = [
  {
    event:
      "Egon Schiele painted 'Portrait of Wally' (Bildnis Wally) in 1912, depicting his model and companion Walburga Neuzil. Oil on wood panel, 32 × 39.8 cm (portrait orientation). The painting was one of Schiele's most personal works, completed during the height of his Expressionist period.",
    date: "1912-01-01",
    location: "Vienna, Austria",
    source:
      "https://www.leopoldmuseum.org/en/artworks/625/portrait-of-wally",
    sourceType: "museum-catalogue",
    verifiedBy: "Leopold Museum, Vienna",
    tier: "verifiedByAuthority",
    confidence: 0.95,
    isGeneralKnowledge: false,
  },
  {
    event:
      "Acquired by Lea Bondi Jaray, a prominent Viennese art dealer, at an unknown date before 1925. Bondi Jaray was the sole proprietor of the Würthle Gallery, Vienna, and one of the early significant collectors of Schiele's work.",
    date: "1925-01-01",
    location: "Vienna, Austria",
    source:
      "https://www.kulturgutverluste.de/Webs/DE/Suche/Index.html",
    sourceType: "register",
    verifiedBy: "German Lost Art Foundation (Deutsches Zentrum Kulturgutverluste)",
    tier: "verifiedByAuthority",
    confidence: 0.85,
    isGeneralKnowledge: false,
  },
  {
    event:
      "Following the Anschluss (annexation of Austria, March 1938) and under direct duress from Friedrich Welz, a Nazi-affiliated art dealer who had been appointed commissioner for Aryanisation of Viennese art galleries, Lea Bondi Jaray was forced to transfer 'Portrait of Wally' to Welz. Bondi Jaray received no payment and immediately fled Austria for London. This transfer is the subject of the Lost Art Foundation registration.",
    date: "1938-03-01",
    location: "Vienna, Austria",
    source:
      "https://www.kulturgutverluste.de/Webs/DE/Suche/Index.html",
    sourceType: "register",
    verifiedBy: "German Lost Art Foundation (Deutsches Zentrum Kulturgutverluste)",
    tier: "verifiedByAuthority",
    confidence: 0.95,
    isGeneralKnowledge: false,
  },
  {
    event:
      "After World War II (c. 1945–1954) the painting passed through Austrian state custody. It was eventually acquired by Rudolf Leopold, a Viennese ophthalmologist and collector, who built what became the Leopold Collection. Leopold acquired the painting in the 1950s, reportedly without knowledge of the forced transfer from Bondi Jaray. The 1945–1954 ownership gap is genuine and was acknowledged in the subsequent litigation.",
    date: "1954-01-01",
    location: "Vienna, Austria",
    source:
      "https://www.nytimes.com/2010/07/21/arts/21wally.html",
    sourceType: "press",
    verifiedBy: "New York Times",
    tier: "reportedInPress",
    confidence: 0.8,
    isGeneralKnowledge: false,
  },
  {
    event:
      "The painting was included in a major Egon Schiele exhibition on loan from the Leopold Collection at the Museum of Modern Art, New York (5 October 1997). Heirs of Lea Bondi Jaray filed a request with the Manhattan DA for the painting to be held pending investigation of Nazi-era provenance. The Manhattan DA issued a subpoena; the painting was seized by New York authorities and held at the MoMA for years.",
    date: "1997-10-05",
    location: "Museum of Modern Art, New York City, USA",
    source:
      "https://www.nytimes.com/1997/12/20/nyregion/new-york-seizure-schiele-art-raises-issues-of-stolen-cultural-property.html",
    sourceType: "press",
    verifiedBy: "New York Times",
    tier: "reportedInPress",
    confidence: 0.95,
    isGeneralKnowledge: false,
  },
  {
    event:
      "US Second Circuit Court of Appeals ruled (2001) that 'Portrait of Wally' constituted stolen property under the National Stolen Property Act (NSPA) and that the case could proceed to trial. This was a landmark ruling on the application of the NSPA to Nazi-looted art.",
    date: "2001-01-01",
    location: "New York, USA",
    source:
      "https://law.justia.com/cases/federal/appellate-courts/F3/252/267/571018/",
    sourceType: "legal",
    verifiedBy: "US Second Circuit Court of Appeals",
    tier: "verifiedByAuthority",
    confidence: 0.95,
    isGeneralKnowledge: false,
  },
  {
    event:
      "Settlement reached: the Leopold Museum (which had absorbed the Leopold Collection) agreed to pay $19 million to the heirs of Lea Bondi Jaray in exchange for the release of the painting. The settlement, announced July 2010, allowed the Leopold Museum to retain the painting while acknowledging the Nazi-era provenance claim. 'Portrait of Wally' is now permanently displayed at the Leopold Museum, Vienna.",
    date: "2010-07-20",
    location: "Vienna, Austria / New York, USA",
    source:
      "https://www.nytimes.com/2010/07/21/arts/21wally.html",
    sourceType: "press",
    verifiedBy: "New York Times",
    tier: "reportedInPress",
    confidence: 0.95,
    isGeneralKnowledge: false,
  },
  {
    event:
      "The painting is registered in the Lost Art Database (Kulturgutverluste.de) as a case of Nazi-era cultural property spoliation. The registration reflects the 1938 forced transfer from Lea Bondi Jaray and the subsequent restitution-by-settlement in 2010. The case is a primary reference in European and US Holocaust-era art restitution law.",
    date: "2010-01-01",
    location: null,
    source:
      "https://www.kulturgutverluste.de/Webs/DE/Suche/Index.html",
    sourceType: "register",
    verifiedBy: "German Lost Art Foundation (Deutsches Zentrum Kulturgutverluste)",
    tier: "verifiedByAuthority",
    confidence: 0.95,
    isGeneralKnowledge: false,
  },
];

export const SCHIELE_WALLY_REGISTRY_CHECKS: RegistryCheckRecord[] = [
  {
    registry: "INTERPOL Stolen Works of Art Database",
    assertedBy: "INTERPOL — Cultural Heritage Crime Unit",
    access: "grounded-search",
    verdict: "possible-match",
    method:
      "Grounded search over interpol.int for 'Portrait of Wally Schiele'. INTERPOL cultural heritage crime materials reference this painting as a prominent Nazi-era spoliation case, particularly in educational materials on Holocaust-era art restitution.",
    caveat:
      "A source on this registry's domain names this object. This is a lead requiring human verification. The painting was in legal dispute (not 'stolen' in the criminal sense) for over a decade and the dispute is now resolved by settlement. Its SWOA entry status should be confirmed directly with INTERPOL.",
    hits: [
      {
        claim:
          "INTERPOL cultural heritage materials reference Schiele's Portrait of Wally as a canonical Nazi-era spoliation case",
        source: "https://www.interpol.int/en/Crimes/Cultural-heritage-crime",
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
      "Not queryable programmatically. The painting's status following the 2010 settlement should be verified via the ID-Art app or direct INTERPOL query.",
    hits: [],
    officialSearch:
      "https://www.interpol.int/en/Crimes/Cultural-heritage-crime/ID-Art-mobile-app",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    registry: "FBI National Stolen Art File",
    assertedBy: "US Federal Bureau of Investigation — Art Crime Team",
    access: "grounded-search",
    verdict: "possible-match",
    method:
      "Grounded search over fbi.gov for 'Portrait of Wally Schiele'. The FBI Art Crime Team has documented this case as a major Nazi-era art restitution matter and referenced it in public materials.",
    caveat:
      "A source on this registry's domain names this object. The 2010 settlement resolved the dispute; the FBI NSAF listing (if any) should be confirmed as potentially withdrawn or updated post-settlement.",
    hits: [
      {
        claim:
          "FBI Art Crime Team has documented Schiele's Portrait of Wally as a major Nazi-era art restitution case; painting was seized in New York (1997) under National Stolen Property Act",
        source: "https://www.fbi.gov/investigate/violent-crime/art-theft",
        riskRelevant: true,
      },
    ],
    officialSearch: "https://artcrimes.fbi.gov/",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    registry: "Carabinieri TPC — Leonardo database",
    assertedBy: "Comando Carabinieri Tutela Patrimonio Culturale (Italy)",
    access: "grounded-search",
    verdict: "no-evidence-found",
    method:
      "Grounded search over carabinieri.it. No results for Portrait of Wally Schiele. The TPC archive focuses primarily on Italian cultural property; an Austrian-origin painting does not fall within its primary coverage.",
    caveat:
      "No evidence surfaced. This is NOT a clean bill of health. The TPC has limited coverage of Austrian-origin works; the absence of a TPC record does not address the Nazi-era provenance history.",
    hits: [],
    officialSearch: "https://tpcweb.carabinieri.it/SitoPubblico/ricerca",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    registry: "Lost Art Database",
    assertedBy: "German Lost Art Foundation (Deutsches Zentrum Kulturgutverluste)",
    access: "grounded-search",
    verdict: "possible-match",
    method:
      "Grounded search over kulturgutverluste.de and lostart.de for 'Portrait of Wally Schiele'. The Lost Art Database registers this painting as a Nazi-era spoliation case (forced transfer from Lea Bondi Jaray to Friedrich Welz, 1938). The registration reflects the well-documented forced transfer.",
    caveat:
      "A source on this registry's domain names this object. The painting's registration in the Lost Art Database confirms the 1938 forced transfer. The 2010 settlement means the legal dispute is resolved, but the historical spoliation record remains.",
    hits: [
      {
        claim:
          "Lost Art Database: Egon Schiele, Portrait of Wally (1912) — registered as Nazi-era spoliation; forced transfer from Lea Bondi Jaray to Friedrich Welz, Vienna 1938",
        source: "https://www.kulturgutverluste.de/Webs/DE/Suche/Index.html",
        riskRelevant: true,
      },
    ],
    officialSearch: "https://www.lostart.de/en/search",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    registry: "Getty Provenance Index",
    assertedBy: "Getty Research Institute",
    access: "grounded-search",
    verdict: "possible-match",
    method:
      "Grounded search over getty.edu. The Getty Provenance Index contains documentation of the painting's ownership chain through the Austrian art market, including dealer records from the 1938–1954 period. The GPI is the primary archival source for reconstructing the Nazi-era chain.",
    caveat:
      "A source on the Getty domain names this object. The Getty Provenance Index auction and dealer records are the key archival source for the Nazi-era ownership chain. Records confirm the gap in documented ownership 1938–c.1954.",
    hits: [
      {
        claim:
          "Getty Provenance Index: auction and dealer records document Portrait of Wally ownership chain including Nazi-era forced transfer period (1938–1954 gap)",
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
      "Grounded search over icom.museum. No specific listing. ICOM Red Lists address current trafficking risk categories; Nazi-era restitution cases of works in institutional custody are not within their scope.",
    caveat:
      "No evidence surfaced. ICOM Red Lists address ongoing trafficking risk by object category; Nazi-era restitution for works already in museum custody is outside their scope.",
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
      "Wikidata entity Q7236082 (Portrait of Wally). Significant events include spoliation (1938), seizure (1997), settlement (2010). Multiple risk-relevant events. Collection: Leopold Museum (post-2010).",
    caveat:
      "Wikidata is community-maintained and certifies nothing. The events here reflect well-documented public record but are community-edited. Treat as a lead, not a finding. The settlement in 2010 resolved the legal dispute.",
    hits: [
      {
        claim: "significant event: forced transfer / Nazi spoliation (1938); seizure New York (1997); settlement (2010)",
        source: "https://www.wikidata.org/wiki/Q7236082",
        riskRelevant: true,
      },
      {
        claim: "collection: Leopold Museum, Vienna (post-2010 settlement)",
        source: "https://www.wikidata.org/wiki/Q7236082",
        riskRelevant: false,
      },
    ],
    officialSearch: "https://www.wikidata.org/wiki/Q7236082",
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
      "Commercial register not searched at this tier. The Art Loss Register is likely to carry a record of this painting given the decade-long legal dispute; however, the 2010 settlement may mean the listing has been removed or marked resolved.",
    hits: [],
    officialSearch: "https://www.artloss.com/",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
];

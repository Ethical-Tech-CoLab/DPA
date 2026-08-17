/**
 * Fixture data for the Bura askos (terracotta funerary vessel).
 *
 * Object: Bura askos (funerary vessel in the form of a zoomorphic figure)
 * Culture: Bura, Niger (Bura-Asinda-Sikka complex)
 * Period: c. 3rd–11th century CE
 * Acquisition mode: archaeological — looted from unrecorded sites
 * Coverage class: structurally-uncovered
 *
 * This is the hero object: archaeological material from unexcavated,
 * unrecorded sites in the Bura-Asinda complex (Tillabéri region, Niger).
 * Objects were never inventoried by any authority, never reported stolen,
 * and therefore CANNOT appear in any stolen-property register.
 *
 * Sources: ICOM Red List for West Africa; UNESCO Convention 1970;
 * scholarly literature on Bura culture (Haour et al. 2010);
 * TRAFFIC reports on West African illicit antiquities trade.
 *
 * PROVENANCE NOTE: fixture data assembled for DPA v0.4.
 */
import type { TimelineEvent, RegistryCheckRecord } from "@dpa/schema";

export const BURA_ASKOS_TIMELINE: TimelineEvent[] = [
  {
    event:
      "Archaeological context: Bura-Asinda-Sikka complex, Tillabéri region, Niger. Terracotta zoomorphic and anthropomorphic funerary vessels (askoi) are a characteristic product of the Bura cultural tradition, dating approximately 3rd–11th century CE. Sites were known to local communities but not systematically excavated or inventoried by state authorities.",
    date: null,
    location: "Bura-Asinda-Sikka complex, Tillabéri Region, Niger",
    source:
      "https://www.cambridge.org/core/journals/azania-archaeological-research-in-africa/article/bura-asinda-sikka-archaeological-complex/",
    sourceType: "scholarly",
    verifiedBy: "Cambridge University Press — Azania: Archaeological Research in Africa",
    tier: "reportedInPress",
    confidence: 0.8,
    isGeneralKnowledge: false,
  },
  {
    event:
      "ICOM Red List for West African Cultural Objects (2003, updated 2015) identifies terracotta funerary vessels from the Bura region (Niger) as a category at high risk of illicit trafficking. The listing applies to object TYPES, not individual pieces; no individual Bura askos is registered in any criminal database.",
    date: "2003-01-01",
    location: null,
    source: "https://icom.museum/en/resources/red-lists/red-list-west-africa/",
    sourceType: "register",
    verifiedBy: "International Council of Museums",
    tier: "verifiedByAuthority",
    confidence: 0.9,
    isGeneralKnowledge: false,
  },
  {
    event:
      "Intensive looting of Bura sites reported through the 1990s and 2000s. Local informants and field archaeologists documented large-scale mechanical extraction. Objects entered the international market primarily through Mali and then European dealers, with no documentation of origin.",
    date: "1995-01-01",
    location: "Tillabéri Region, Niger",
    source:
      "https://www.jstor.org/stable/20697597",
    sourceType: "scholarly",
    verifiedBy: "JSTOR — Journal of African Archaeology",
    tier: "reportedInPress",
    confidence: 0.65,
    isGeneralKnowledge: false,
  },
  {
    event:
      "Niger ratified the 1970 UNESCO Convention on the Means of Prohibiting and Preventing the Illicit Import, Export and Transfer of Ownership of Cultural Property on 6 December 1997. Any Bura object removed after that date is in breach of Niger law and the Convention. However, the Convention requires a pre-existing inventory — which Bura sites lack.",
    date: "1997-12-06",
    location: null,
    source:
      "https://en.unesco.org/nations/niger",
    sourceType: "legal",
    verifiedBy: "UNESCO",
    tier: "verifiedByAuthority",
    confidence: 0.95,
    isGeneralKnowledge: false,
  },
  {
    event:
      "Structural coverage gap: because Bura funerary sites were not inventoried before looting began, objects from this complex cannot appear in INTERPOL SWOA, the FBI National Stolen Art File, or the Carabinieri TPC archive — those registers hold records of REPORTED THEFTS from DOCUMENTED COLLECTIONS. The absence of any register hit for a Bura askos is therefore uninformative and must not be read as evidence of clean provenance.",
    date: null,
    location: null,
    source:
      "https://www.interpol.int/en/Crimes/Cultural-heritage-crime/Stolen-Works-of-Art-Database",
    sourceType: "policy",
    verifiedBy: "INTERPOL — Cultural Heritage Crime Unit (coverage note)",
    tier: "inferred",
    confidence: 0.95,
    isGeneralKnowledge: false,
  },
  {
    event:
      "TRAFFIC and UNESCO have documented that West African terracotta objects from Niger and Mali are among the most heavily trafficked categories of cultural property. Major auction house sales of Bura objects in Paris and Brussels during the 1990s–2010s typically carried provenance described only as 'European private collection, acquired before 1970' — a formulation that the 1970 cutoff was specifically intended to make meaningful, but which cannot be verified for unrecorded sites.",
    date: null,
    location: null,
    source:
      "https://www.traffic.org/publications/reports/stemming-the-tide-african-cultural-property-trafficking/",
    sourceType: "scholarly",
    verifiedBy: "TRAFFIC (wildlife and wildlife products trade monitoring)",
    tier: "reportedInPress",
    confidence: 0.6,
    isGeneralKnowledge: false,
  },
];

export const BURA_ASKOS_REGISTRY_CHECKS: RegistryCheckRecord[] = [
  {
    registry: "INTERPOL Stolen Works of Art Database",
    assertedBy: "INTERPOL — Cultural Heritage Crime Unit",
    access: "referral-only",
    verdict: "not-queryable",
    method:
      "No programmatic access exists to INTERPOL SWOA. A referral link is emitted. However, the structural point must be noted: Bura funerary objects were never inventoried by Niger authorities before looting began. They cannot be in this register because a theft must be REPORTED to enter it, and an unrecorded excavation produces no theft report.",
    caveat:
      "Not queryable programmatically. More fundamentally: the structural coverage gap means a null result here is not a negative finding. Objects looted from unrecorded sites are architecturally absent from stolen-property registers regardless of their actual provenance.",
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
    method:
      "No programmatic access exists. See INTERPOL SWOA note — structural absence applies here too.",
    caveat:
      "Not queryable programmatically. The structural absence from stolen-property registers applies equally to this interface of the SWOA database.",
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
      "Grounded search over fbi.gov. No results naming Bura or the Bura-Asinda complex were found. This register requires a police report and a value threshold — neither applies to unrecorded looting in Niger.",
    caveat:
      "No evidence surfaced. This is NOT a clean bill of health. The FBI NSAF records reported thefts from documented collections; it cannot hold records of objects looted from unexcavated, uninventoried sites.",
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
      "Grounded search over carabinieri.it and beniculturali.it. No results for Bura askos or Bura terracotta Niger. The TPC archive covers primarily Italian cultural property and Italian-market thefts.",
    caveat:
      "No evidence surfaced. This is NOT a clean bill of health. The TPC archive is the most important source for Italian antiquities; it has very limited coverage of West African archaeological material.",
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
      "Grounded search over lostart.de. No results. This register covers Nazi-era spoliation (1933–1945) exclusively; it has no coverage of archaeological looting from West Africa.",
    caveat:
      "No evidence surfaced. The Lost Art Database covers Nazi-era and wartime cultural property loss only. It is structurally irrelevant to Bura material — a null result here carries no information about the object's provenance.",
    hits: [],
    officialSearch: "https://www.lostart.de/en/search",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    registry: "Getty Provenance Index",
    assertedBy: "Getty Research Institute",
    access: "grounded-search",
    verdict: "no-evidence-found",
    method:
      "Grounded search over getty.edu. No auction catalogue or dealer stock-book entries for Bura askos found. The Getty Provenance Index is strongest on the European and American art market and thin on West African material.",
    caveat:
      "No evidence surfaced. The Getty Provenance Index transcribes European auction catalogues and dealer inventories; it has very limited coverage of West African archaeological material, especially objects that moved through opaque channels.",
    hits: [],
    officialSearch:
      "https://www.getty.edu/research/tools/provenance/search.html",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    registry: "ICOM Red Lists of Cultural Objects at Risk",
    assertedBy: "International Council of Museums",
    access: "grounded-search",
    verdict: "possible-match",
    method:
      "Grounded search over icom.museum. The ICOM Red List for West African Cultural Objects (2003, updated 2015) explicitly identifies terracotta funerary vessels from Niger as a high-risk category. This is a TYPE match, not an individual object identification.",
    caveat:
      "The ICOM Red List identifies CATEGORIES of objects at risk, not individual pieces. A match here means 'objects of this type from this region are at high risk of illicit trafficking and require documentation'. It is a due-diligence trigger, not a theft record.",
    hits: [
      {
        claim:
          "ICOM Red List West Africa identifies terracotta funerary vessels from Niger (Bura region) as a high-risk trafficking category",
        source: "https://icom.museum/en/resources/red-lists/red-list-west-africa/",
        riskRelevant: true,
      },
    ],
    officialSearch: "https://icom.museum/en/resources/red-lists/",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    registry: "Wikidata (structured provenance events)",
    assertedBy: "Wikidata contributors — community-maintained, not an authority",
    access: "structured-api",
    verdict: "no-evidence-found",
    method:
      "Wikidata entity search for 'Bura askos Niger terracotta'. No individual Bura funerary vessels are registered as individual Wikidata entities — consistent with their archaeological, uninventoried status.",
    caveat:
      "No entity found. Wikidata is community-maintained and certifies nothing. The absence of a Wikidata entry for this object reflects the general invisibility of uninventoried archaeological material in Western databases, not a clean provenance.",
    hits: [],
    officialSearch: "https://www.wikidata.org/",
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
      "The Art Loss Register is a commercial service. Even if searched, it records REPORTED LOSSES from known collections. For uninventoried Bura material, a null ALR result carries the same structural limitation as the police registers above.",
    hits: [],
    officialSearch: "https://www.artloss.com/",
    checkedAt: "2025-01-15T00:00:00.000Z",
  },
];

/**
 * Source-bias disclosure module (ADR-008).
 *
 * PROVENANCE: generalised from Ethical-Tech-CoLab/arts-provenance-agent
 *   (src/tools/tavily.ts — KNOWN COVERAGE BIAS comment) and
 *   Ethical-Tech-CoLab/provenance-search (server.js). The bias observation
 *   appears verbatim in both upstream sources; preserving it here is a
 *   deliberate design choice, not an admission of a fixable bug.
 *   See docs/DECISIONS.md#adr-008.
 */

/**
 * The permitted source list is predominantly Western institutions plus one
 * commercial register, and the bias runs against this tool's own motivation.
 *
 * The case for building it rests on objects that stolen-art registers cannot
 * catch: material taken from an archaeological site or under colonial rule,
 * never inventoried and never reported stolen. This list searches BEST where
 * objects are already well documented (major Western museum holdings) and
 * WORST exactly where the motivating harm lives (source-country archives,
 * colonial-era and archaeological material).
 *
 * A low confidence score for a Cambodian sculpture and a low score for a
 * Dutch painting therefore do not mean the same thing — the same number
 * reflects opposite information densities.
 *
 * This is a self-declared known limitation carried from both upstream repos.
 * Extending the source list toward source-country institutions is the first
 * substantive piece of future work; every other improvement operates on
 * evidence the tool was able to find, and this list decides what it can
 * find at all.
 */
export const SOURCE_BIAS_NOTE: string = [
  "KNOWN COVERAGE BIAS: the evidence sources consulted are predominantly Western",
  "institutions (The Metropolitan Museum of Art, Art Institute of Chicago, MoMA,",
  "Victoria & Albert Museum, Europeana, Wikidata, Wikipedia) plus one commercial",
  "register (Art Loss Register). These sources search best where objects are already",
  "well documented in Western scholarship, and worst exactly where the motivating",
  "harm lives — material taken from an unrecorded archaeological site or under",
  "colonial rule, which was never inventoried and therefore cannot appear in a",
  "stolen-property register at all. A low confidence score for an object from a",
  "source country with no Western-facing archive means something completely different",
  "from a low score for a Dutch master. The sources listed here are a starting point,",
  "not a complete coverage map.",
].join(" ");

/** Structured form of the bias declaration for machine consumers. */
export const SOURCE_BIAS = {
  note: SOURCE_BIAS_NOTE,
  geographicBias: "predominantly-western",
  strongestFor: [
    "Major Western museum collections",
    "European old masters",
    "Nazi-era spoliation (Germany, Austria, France, Netherlands)",
    "Greek/Roman antiquities with Italian documentation",
  ],
  weakestFor: [
    "Sub-Saharan African archaeological material",
    "South and Southeast Asian temple material",
    "Pre-Columbian objects",
    "Colonial-era objects never inventoried",
    "Objects from countries with no Western-facing archive",
  ],
} as const;

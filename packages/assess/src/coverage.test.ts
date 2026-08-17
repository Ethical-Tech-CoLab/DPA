import { describe, it, expect } from "vitest";
import { computeCoverage, areComparable, scoreIsUninformative, REGISTER_SCOPES } from "./coverage.js";

/* -------------------------------------------------------------------------- */
/* ICOM Red Lists — never identifying                                          */
/* -------------------------------------------------------------------------- */

describe("ICOM Red Lists — identifying === false", () => {
  it("ICOM Red List scope is marked non-identifying in REGISTER_SCOPES", () => {
    const icom = REGISTER_SCOPES.find((r) => r.id === "icom-red-lists");
    expect(icom).toBeDefined();
    expect(icom!.identifying).toBe(false);
  });

  it("ICOM Red Lists go to weakRegisters, never identifyingRegisters (archaeological)", () => {
    const c = computeCoverage({ region: "egypt", mode: "archaeological" });
    expect(c.identifyingRegisters.some((r) => r.id === "icom-red-lists")).toBe(false);
    expect(c.weakRegisters.some((r) => r.id === "icom-red-lists")).toBe(true);
  });

  it("ICOM Red Lists go to weakRegisters, never identifyingRegisters (colonial)", () => {
    const c = computeCoverage({ region: "cambodia", mode: "colonial" });
    expect(c.identifyingRegisters.some((r) => r.id === "icom-red-lists")).toBe(false);
    expect(c.weakRegisters.some((r) => r.id === "icom-red-lists")).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* Rosetta Stone — colonial Egypt → structurally-uncovered                    */
/* -------------------------------------------------------------------------- */

describe("Rosetta Stone — colonial/Egypt", () => {
  it("is structurally-uncovered", () => {
    const c = computeCoverage({ region: "egypt", mode: "colonial" });
    expect(c.coverageClass).toBe("structurally-uncovered");
  });

  it("has zero identifying registers", () => {
    const c = computeCoverage({ region: "egypt", mode: "colonial" });
    expect(c.identifyingRegisters).toHaveLength(0);
  });

  it("coverageRatio is 0", () => {
    const c = computeCoverage({ region: "egypt", mode: "colonial" });
    expect(c.coverageRatio).toBe(0);
  });

  it("scoreIsUninformative returns true", () => {
    const c = computeCoverage({ region: "egypt", mode: "colonial" });
    expect(scoreIsUninformative(c)).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* Getty Bronze — archaeological/Italy → well-covered                         */
/* -------------------------------------------------------------------------- */

describe("Getty Bronze (Victorious Youth) — archaeological/Italy", () => {
  it("is well-covered", () => {
    const c = computeCoverage({ region: "italy", mode: "archaeological" });
    expect(c.coverageClass).toBe("well-covered");
  });

  it("has at least 3 identifying registers", () => {
    const c = computeCoverage({ region: "italy", mode: "archaeological" });
    expect(c.identifyingRegisters.length).toBeGreaterThanOrEqual(3);
  });

  it("includes Carabinieri TPC (Italy-specific)", () => {
    const c = computeCoverage({ region: "italy", mode: "archaeological" });
    expect(c.identifyingRegisters.some((r) => r.id === "carabinieri-tpc")).toBe(true);
  });

  it("scoreIsUninformative returns false", () => {
    const c = computeCoverage({ region: "italy", mode: "archaeological" });
    expect(scoreIsUninformative(c)).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* Colonial object from non-Western region → structurally-uncovered           */
/* -------------------------------------------------------------------------- */

describe("Colonial / non-Western region", () => {
  it("colonial from Cambodia → structurally-uncovered", () => {
    const c = computeCoverage({ region: "cambodia", mode: "colonial" });
    expect(c.coverageClass).toBe("structurally-uncovered");
  });

  it("colonial from Nigeria → structurally-uncovered", () => {
    const c = computeCoverage({ region: "nigeria", mode: "colonial" });
    expect(c.coverageClass).toBe("structurally-uncovered");
  });

  it("colonial from India → structurally-uncovered", () => {
    const c = computeCoverage({ region: "india", mode: "colonial" });
    expect(c.coverageClass).toBe("structurally-uncovered");
  });
});

/* -------------------------------------------------------------------------- */
/* Nazi-era Western market → well-covered                                     */
/* -------------------------------------------------------------------------- */

describe("Nazi-era / Western market", () => {
  it("nazi-era from Germany → well-covered", () => {
    const c = computeCoverage({ region: "germany", mode: "nazi-era" });
    expect(c.coverageClass).toBe("well-covered");
  });

  it("includes Lost Art Database for Germany nazi-era", () => {
    const c = computeCoverage({ region: "germany", mode: "nazi-era" });
    expect(c.identifyingRegisters.some((r) => r.id === "lostart-de")).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* areComparable — comparability helper                                        */
/* -------------------------------------------------------------------------- */

describe("areComparable", () => {
  it("returns true for two well-covered objects", () => {
    const a = computeCoverage({ region: "germany", mode: "nazi-era" });
    const b = computeCoverage({ region: "italy", mode: "archaeological" });
    expect(areComparable(a, b)).toBe(true);
  });

  it("returns false across coverage classes (well-covered vs structurally-uncovered)", () => {
    const wellCovered = computeCoverage({ region: "italy", mode: "archaeological" });
    const uncovered = computeCoverage({ region: "egypt", mode: "colonial" });
    expect(areComparable(wellCovered, uncovered)).toBe(false);
  });

  it("objects with similar scores but different coverage classes are non-comparable", () => {
    // Both score similarly (low), but coverage classes differ
    const wellCovered = computeCoverage({ region: "italy", mode: "archaeological" });
    const uncovered = computeCoverage({ region: "cambodia", mode: "colonial" });
    expect(wellCovered.coverageClass).toBe("well-covered");
    expect(uncovered.coverageClass).toBe("structurally-uncovered");
    expect(areComparable(wellCovered, uncovered)).toBe(false);
  });

  it("returns true for two structurally-uncovered objects", () => {
    const a = computeCoverage({ region: "cambodia", mode: "colonial" });
    const b = computeCoverage({ region: "nigeria", mode: "colonial" });
    expect(areComparable(a, b)).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* Coverage never changes with score input (structural independence)          */
/* -------------------------------------------------------------------------- */

describe("Coverage structural independence from score", () => {
  it("computeCoverage output is identical regardless of any score information", () => {
    // Coverage function takes no score parameter at all — structural enforcement.
    // This test verifies the output is deterministic from coverage inputs alone.
    const c1 = computeCoverage({ region: "egypt", mode: "colonial" });
    const c2 = computeCoverage({ region: "egypt", mode: "colonial" });
    expect(c1).toStrictEqual(c2);
  });

  it("the Coverage type has no confidenceScore field (structural proof)", () => {
    const c = computeCoverage({ region: "italy", mode: "archaeological" });
    // TypeScript would reject this at compile time; verify at runtime too
    expect("confidenceScore" in c).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* Mode detection from corpus text                                             */
/* -------------------------------------------------------------------------- */

describe("Mode detection from corpus", () => {
  it("detects nazi-era from corpus text", () => {
    const c = computeCoverage({ corpus: "forced sale during Nazi occupation 1941", region: "france" });
    expect(c.acquisitionMode).toBe("nazi-era");
  });

  it("detects archaeological from corpus text", () => {
    const c = computeCoverage({ corpus: "clandestine excavation from a necropolis site", region: "italy" });
    expect(c.acquisitionMode).toBe("archaeological");
  });

  it("explicit mode overrides corpus detection", () => {
    const c = computeCoverage({ corpus: "Nazi occupation forced sale", mode: "market", region: "france" });
    expect(c.acquisitionMode).toBe("market");
  });

  it("falls back to unknown when no signal present", () => {
    const c = computeCoverage({ corpus: "painting oil on canvas", region: "france" });
    expect(c.acquisitionMode).toBe("unknown");
  });

  it("unknown mode treats all register modes as applicable", () => {
    // Unknown mode → modeOk is always true → no mode-based blinds
    const c = computeCoverage({ mode: "unknown", region: "germany" });
    const modeBlind = c.blindRegisters.filter((r) => r.why.includes("Holds"));
    expect(modeBlind).toHaveLength(0);
  });
});

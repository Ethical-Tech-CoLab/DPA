import { describe, it, expect } from "vitest";
import { assess } from "./assess.js";
import { scoreProvenance } from "./scorer.js";
import { computeCoverage, areComparable } from "./coverage.js";
import { computeForgeryRisk } from "./forgery.js";
import type { TimelineEvent, ForensicSignal } from "@dpa/schema";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function makeEvent(
  overrides: Partial<TimelineEvent> & { event: string; tier: TimelineEvent["tier"] },
): TimelineEvent {
  return {
    event: overrides.event,
    // Use !== undefined so explicit null is preserved (null ?? "1850" would wrongly coerce)
    date: overrides.date !== undefined ? overrides.date : "1850",
    location: overrides.location ?? null,
    source: overrides.source ?? "test-source",
    sourceType: overrides.sourceType ?? "document",
    verifiedBy: overrides.verifiedBy ?? "test",
    tier: overrides.tier,
    confidence: overrides.confidence ?? 0.8,
    isGeneralKnowledge: overrides.isGeneralKnowledge ?? false,
  };
}

/* -------------------------------------------------------------------------- */
/* Rosetta Stone — flagship demonstration case                                 */
/*                                                                             */
/* The Rosetta Stone (196 BC, Egypt) was seized by French forces, then        */
/* transferred to Britain under the 1801 Treaty of Alexandria. It is          */
/* well-documented in press and British Museum records but colonial in its    */
/* acquisition mode.                                                           */
/*                                                                             */
/* Expected reading: "the registers could never have named this; the score    */
/* measures our blindness, not the object."                                   */
/* -------------------------------------------------------------------------- */

const ROSETTA_STONE_TIMELINE: TimelineEvent[] = [
  makeEvent({
    event: "Discovered by French forces during the Egyptian campaign",
    tier: "reportedInPress",
    date: "1799",
    source: "Historical records of the Egyptian campaign",
  }),
  makeEvent({
    event: "Transferred to British Museum under Treaty of Alexandria",
    tier: "reportedInPress",
    date: "1801",
    source: "British Museum acquisition records",
  }),
  makeEvent({
    event: "Decipherment announced by Champollion",
    tier: "reportedInPress",
    date: "1822",
    source: "Académie des Inscriptions announcement",
  }),
];

describe("Rosetta Stone — flagship demonstration", () => {
  it("coverage is structurally-uncovered", () => {
    const result = assess({
      timeline: ROSETTA_STONE_TIMELINE,
      region: "egypt",
      acquisitionMode: "colonial",
      corpus: "colonial acquisition British Museum",
    });
    expect(result.coverage.coverageClass).toBe("structurally-uncovered");
  });

  it("has zero identifying registers", () => {
    const result = assess({
      timeline: ROSETTA_STONE_TIMELINE,
      region: "egypt",
      acquisitionMode: "colonial",
    });
    expect(result.coverage.identifyingRegisters).toHaveLength(0);
  });

  it("score is low (colonial acquisition, limited provenance documentation)", () => {
    const result = assess({
      timeline: ROSETTA_STONE_TIMELINE,
      region: "egypt",
      acquisitionMode: "colonial",
    });
    // 30 (base) + 3×8 (press) = 54; no gap because all events dated before 1900
    expect(result.confidenceScore).toBe(54);
  });

  it("scorer is accumulation-v0.4", () => {
    const result = assess({
      timeline: ROSETTA_STONE_TIMELINE,
      region: "egypt",
      acquisitionMode: "colonial",
    });
    expect(result.scorer).toBe("accumulation-v0.4");
  });

  it("reading: score measures blindness, not object", () => {
    // The note should describe structural absence of coverage
    const result = assess({
      timeline: ROSETTA_STONE_TIMELINE,
      region: "egypt",
      acquisitionMode: "colonial",
    });
    expect(result.coverage.note).toMatch(/no register.*can.*systematically.*name/i);
  });
});

/* -------------------------------------------------------------------------- */
/* Getty Bronze (Victorious Youth) — flagship demonstration case              */
/*                                                                             */
/* The Victorious Youth is a Greek bronze allegedly dredged from the Adriatic */
/* off the Italian coast in 1964 and sold to the Getty Museum. Italian        */
/* authorities have sought its return for decades.                             */
/*                                                                             */
/* Expected reading: "records ought to exist here and they are thin; the      */
/* score measures the object."                                                 */
/* -------------------------------------------------------------------------- */

const GETTY_BRONZE_TIMELINE: TimelineEvent[] = [
  makeEvent({
    event: "Allegedly found by fishermen in the Adriatic",
    tier: "reportedInPress",
    date: null, // undated — murky acquisition
    source: "Art newspaper reporting",
  }),
  makeEvent({
    event: "Acquired by J. Paul Getty Museum",
    tier: "reportedInPress",
    date: "1977",
    source: "Getty Museum acquisition announcement",
  }),
];

describe("Getty Bronze (Victorious Youth) — flagship demonstration", () => {
  it("coverage is well-covered", () => {
    const result = assess({
      timeline: GETTY_BRONZE_TIMELINE,
      region: "italy",
      acquisitionMode: "archaeological",
    });
    expect(result.coverage.coverageClass).toBe("well-covered");
  });

  it("has at least 3 identifying registers", () => {
    const result = assess({
      timeline: GETTY_BRONZE_TIMELINE,
      region: "italy",
      acquisitionMode: "archaeological",
    });
    expect(result.coverage.identifyingRegisters.length).toBeGreaterThanOrEqual(3);
  });

  it("score is low (thin documentation, provenance gap)", () => {
    const result = assess({
      timeline: GETTY_BRONZE_TIMELINE,
      region: "italy",
      acquisitionMode: "archaeological",
    });
    // 30 (base) + 2×8 (press) - 12 (gap: 1 undated event) = 34
    expect(result.confidenceScore).toBe(34);
  });

  it("reading: low score is informative because well-covered", () => {
    // A well-covered object with a low score means records SHOULD exist but don't
    const result = assess({
      timeline: GETTY_BRONZE_TIMELINE,
      region: "italy",
      acquisitionMode: "archaeological",
    });
    expect(result.coverage.coverageClass).toBe("well-covered");
    expect(result.confidenceScore).toBeLessThan(50);
    // The low number here is the MORE informative result
  });
});

/* -------------------------------------------------------------------------- */
/* Comparability across coverage classes                                       */
/* -------------------------------------------------------------------------- */

describe("Comparability", () => {
  it("Rosetta Stone and Getty Bronze have similar low scores but different coverage classes", () => {
    const rosetta = assess({
      timeline: ROSETTA_STONE_TIMELINE,
      region: "egypt",
      acquisitionMode: "colonial",
    });
    const getty = assess({
      timeline: GETTY_BRONZE_TIMELINE,
      region: "italy",
      acquisitionMode: "archaeological",
    });

    // Both have low-ish scores
    expect(rosetta.confidenceScore).toBeLessThan(70);
    expect(getty.confidenceScore).toBeLessThan(70);

    // But they are NOT comparable
    expect(areComparable(rosetta.coverage, getty.coverage)).toBe(false);
  });

  it("areComparable returns false when one is structurally-uncovered and other is well-covered", () => {
    const a = computeCoverage({ region: "egypt", mode: "colonial" });
    const b = computeCoverage({ region: "italy", mode: "archaeological" });
    expect(a.coverageClass).toBe("structurally-uncovered");
    expect(b.coverageClass).toBe("well-covered");
    expect(areComparable(a, b)).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* unsourcedAssertion flag                                                     */
/* -------------------------------------------------------------------------- */

describe("assess — unsourcedAssertion flag", () => {
  it("emits medium-severity unsourcedAssertion for generalKnowledge events", () => {
    const result = assess({
      timeline: [
        makeEvent({ event: "Well-sourced event", tier: "verifiedByAuthority" }),
        makeEvent({
          event: "Model-inferred event",
          tier: "inferred",
          isGeneralKnowledge: true,
          source: "model-knowledge",
        }),
      ],
    });
    const flag = result.flags.find((f) => f.type === "unsourcedAssertion");
    expect(flag).toBeDefined();
    expect(flag?.severity).toBe("medium");
  });

  it("does not emit unsourcedAssertion for non-generalKnowledge events", () => {
    const result = assess({
      timeline: [makeEvent({ event: "Normal event", tier: "verifiedByAuthority" })],
    });
    expect(result.flags.some((f) => f.type === "unsourcedAssertion")).toBe(false);
  });

  it("emits one flag per generalKnowledge event", () => {
    const result = assess({
      timeline: [
        makeEvent({ event: "GK 1", tier: "inferred", isGeneralKnowledge: true }),
        makeEvent({ event: "GK 2", tier: "inferred", isGeneralKnowledge: true }),
        makeEvent({ event: "Normal", tier: "verifiedByAuthority" }),
      ],
    });
    const flags = result.flags.filter((f) => f.type === "unsourcedAssertion");
    expect(flags).toHaveLength(2);
  });
});

/* -------------------------------------------------------------------------- */
/* Three numbers, structural independence                                      */
/* -------------------------------------------------------------------------- */

describe("Structural independence — three numbers never combined", () => {
  it("scorerResult does not include coverage", () => {
    const r = scoreProvenance({ timeline: [] });
    expect("coverage" in r).toBe(false);
    expect("coverageClass" in r).toBe(false);
  });

  it("computeCoverage does not include confidenceScore", () => {
    const c = computeCoverage({ region: "italy", mode: "archaeological" });
    expect("confidenceScore" in c).toBe(false);
  });

  it("computeForgeryRisk does not include confidenceScore or coverage", () => {
    const f = computeForgeryRisk([]);
    expect("confidenceScore" in f).toBe(false);
    expect("coverage" in f).toBe(false);
    expect("coverageClass" in f).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* Forgery risk                                                                */
/* -------------------------------------------------------------------------- */

describe("computeForgeryRisk", () => {
  it("returns 0 for empty signals", () => {
    const r = computeForgeryRisk([]);
    expect(r.score).toBe(0);
  });

  it("computes weighted average for mixed severity signals", () => {
    const signals: ForensicSignal[] = [
      { name: "perceptual-hash", value: 0.9, interpretation: "High mismatch", severity: "high" },
      { name: "metadata-check", value: 0.2, interpretation: "Minor anomaly", severity: "low" },
    ];
    const r = computeForgeryRisk(signals);
    // w=4 for high, w=1 for low
    // (4×0.9 + 1×0.2) / 5 = (3.6 + 0.2) / 5 = 3.8/5 = 0.76 → 76
    expect(r.score).toBe(76);
    expect(r.signals).toHaveLength(2);
  });

  it("score is 0 for all-zero signals", () => {
    const signals: ForensicSignal[] = [
      { name: "test", value: 0, interpretation: "None", severity: "medium" },
    ];
    expect(computeForgeryRisk(signals).score).toBe(0);
  });

  it("score is 100 for all-high severity value=1 signals", () => {
    const signals: ForensicSignal[] = [
      { name: "a", value: 1, interpretation: "Full mismatch", severity: "high" },
      { name: "b", value: 1, interpretation: "Full mismatch", severity: "high" },
    ];
    expect(computeForgeryRisk(signals).score).toBe(100);
  });

  it("clamps value > 1 to 1", () => {
    const signals: ForensicSignal[] = [
      { name: "x", value: 5, interpretation: "Out of range", severity: "medium" },
    ];
    expect(computeForgeryRisk(signals).score).toBe(100);
  });
});

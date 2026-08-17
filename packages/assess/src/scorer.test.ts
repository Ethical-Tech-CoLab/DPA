import { describe, it, expect } from "vitest";
import { scoreProvenance } from "./scorer.js";
import type { TimelineEvent, RiskFlag } from "@dpa/schema";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function event(
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
/* Accumulation model — expected scores                                        */
/* -------------------------------------------------------------------------- */

describe("scoreProvenance — accumulation model", () => {
  it("returns base 30 for an empty timeline", () => {
    const r = scoreProvenance({ timeline: [] });
    expect(r.confidenceScore).toBe(30);
    expect(r.scorer).toBe("accumulation-v0.4");
  });

  it("adds 18 per verifiedByAuthority event", () => {
    const r = scoreProvenance({
      timeline: [
        event({ event: "Acquired by museum", tier: "verifiedByAuthority" }),
        event({ event: "Catalogued in collection", tier: "verifiedByAuthority" }),
      ],
    });
    // 30 + 18 + 18 = 66
    expect(r.confidenceScore).toBe(66);
  });

  it("adds 8 per reportedInPress event", () => {
    const r = scoreProvenance({
      timeline: [
        event({ event: "Featured in newspaper", tier: "reportedInPress" }),
        event({ event: "Review published", tier: "reportedInPress" }),
      ],
    });
    // 30 + 8 + 8 = 46
    expect(r.confidenceScore).toBe(46);
  });

  it("caps score at 100 after positive accumulation", () => {
    // 30 + 5×18 + 3×8 = 30+90+24 = 144 → capped at 100
    const timeline = [
      event({ event: "A1", tier: "verifiedByAuthority" }),
      event({ event: "A2", tier: "verifiedByAuthority" }),
      event({ event: "A3", tier: "verifiedByAuthority" }),
      event({ event: "A4", tier: "verifiedByAuthority" }),
      event({ event: "A5", tier: "verifiedByAuthority" }),
      event({ event: "P1", tier: "reportedInPress" }),
      event({ event: "P2", tier: "reportedInPress" }),
      event({ event: "P3", tier: "reportedInPress" }),
    ];
    const r = scoreProvenance({ timeline });
    expect(r.confidenceScore).toBe(100);
  });

  it("subtracts 12 for a provenance gap (undated event)", () => {
    const r = scoreProvenance({
      timeline: [
        event({ event: "Authority record", tier: "verifiedByAuthority" }),
        event({ event: "Undated gap", tier: "inferred", date: null }),
      ],
    });
    // 30 + 18 - 12 = 36
    expect(r.confidenceScore).toBe(36);
  });

  it("subtracts 12 for a gap when earliest date is after 1900", () => {
    const r = scoreProvenance({
      timeline: [
        event({ event: "Modern acquisition", tier: "verifiedByAuthority", date: "1950" }),
      ],
    });
    // 30 + 18 - 12 = 36  (earliest.date "1950" > "1900" triggers gap)
    expect(r.confidenceScore).toBe(36);
  });

  it("does not apply gap penalty when all events are dated pre-1900", () => {
    const r = scoreProvenance({
      timeline: [
        event({ event: "Old acquisition", tier: "verifiedByAuthority", date: "1802" }),
      ],
    });
    // 30 + 18 = 48  (earliest.date "1802" ≤ "1900" → no gap)
    expect(r.confidenceScore).toBe(48);
  });

  it("subtracts 20 per risk-relevant register hit, max 3", () => {
    const r = scoreProvenance({
      timeline: [event({ event: "Authority record", tier: "verifiedByAuthority" })],
      registry: {
        riskRelevantHits: [
          { claim: "Hit 1", sourceUrl: "https://register.example/1" },
          { claim: "Hit 2", sourceUrl: "https://register.example/2" },
          { claim: "Hit 3", sourceUrl: "https://register.example/3" },
          { claim: "Hit 4 — should be ignored", sourceUrl: "https://register.example/4" },
        ],
        notQueryable: 0,
        checks: [],
      },
    });
    // 30 + 18 - 3×20 = 48 - 60 = -12 → floored at 0
    expect(r.confidenceScore).toBe(0);
  });

  it("floors at 0 (does not go negative)", () => {
    const r = scoreProvenance({
      timeline: [],
      registry: {
        riskRelevantHits: [
          { claim: "H1", sourceUrl: "url1" },
          { claim: "H2", sourceUrl: "url2" },
          { claim: "H3", sourceUrl: "url3" },
        ],
        notQueryable: 0,
        checks: [],
      },
    });
    // 30 - 12 (no dated events → gap) - 60 (3 hits) = -42 → 0
    expect(r.confidenceScore).toBe(0);
  });

  it("valuation anomaly flag raised at ≥3× median", () => {
    const r = scoreProvenance({
      timeline: [event({ event: "Sale", tier: "verifiedByAuthority" })],
      valuation: { price: 900_000, comparableMedian: 100_000 },
    });
    expect(r.flags.some((f) => f.type === "valuationAnomaly")).toBe(true);
  });

  it("no valuation flag when ratio < 3", () => {
    const r = scoreProvenance({
      timeline: [],
      valuation: { price: 200_000, comparableMedian: 100_000 },
    });
    expect(r.flags.some((f) => f.type === "valuationAnomaly")).toBe(false);
  });

  it("crypto flag is forwarded when present", () => {
    const cryptoFlag: RiskFlag = {
      type: "cryptoTransactionFlag",
      severity: "high",
      evidence: "Suspicious tx",
      source: "coinbase",
    };
    const r = scoreProvenance({
      timeline: [],
      cryptoFlag,
    });
    expect(r.flags).toContainEqual(cryptoFlag);
  });

  it("repatriation signal raises repatriationPrecedent and lootingSignal flags", () => {
    const r = scoreProvenance({
      timeline: [
        event({ event: "Object was looted from a temple site", tier: "reportedInPress" }),
      ],
    });
    expect(r.flags.some((f) => f.type === "repatriationPrecedent")).toBe(true);
    expect(r.flags.some((f) => f.type === "lootingSignal")).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* Breakdown invariant                                                         */
/* -------------------------------------------------------------------------- */

describe("scoreProvenance — breakdown invariant", () => {
  it("sum of all breakdown deltas equals confidenceScore (empty timeline)", () => {
    const r = scoreProvenance({ timeline: [] });
    const sum = r.breakdown.reduce((acc, e) => acc + e.delta, 0);
    expect(sum).toBe(r.confidenceScore);
  });

  it("sum of all breakdown deltas equals confidenceScore (mixed events)", () => {
    const r = scoreProvenance({
      timeline: [
        event({ event: "Auth A", tier: "verifiedByAuthority", date: "1850" }),
        event({ event: "Auth B", tier: "verifiedByAuthority", date: "1870" }),
        event({ event: "Press", tier: "reportedInPress", date: "1900" }),
        event({ event: "Gap", tier: "inferred", date: null }),
      ],
    });
    const sum = r.breakdown.reduce((acc, e) => acc + e.delta, 0);
    expect(sum).toBe(r.confidenceScore);
  });

  it("sum of breakdown deltas equals confidenceScore when floored at 0", () => {
    const r = scoreProvenance({
      timeline: [],
      registry: {
        riskRelevantHits: [
          { claim: "H1", sourceUrl: "u1" },
          { claim: "H2", sourceUrl: "u2" },
          { claim: "H3", sourceUrl: "u3" },
        ],
        notQueryable: 0,
        checks: [],
      },
    });
    const sum = r.breakdown.reduce((acc, e) => acc + e.delta, 0);
    expect(sum).toBe(r.confidenceScore);
    expect(r.confidenceScore).toBe(0);
  });

  it("sum of breakdown deltas equals confidenceScore when capped at 100", () => {
    const timeline = Array.from({ length: 6 }, (_, i) =>
      event({ event: `A${i}`, tier: "verifiedByAuthority" }),
    );
    const r = scoreProvenance({ timeline });
    const sum = r.breakdown.reduce((acc, e) => acc + e.delta, 0);
    expect(sum).toBe(r.confidenceScore);
    expect(r.confidenceScore).toBe(100);
  });

  it("last breakdown entry runningTotal equals confidenceScore", () => {
    const r = scoreProvenance({
      timeline: [event({ event: "Auth", tier: "verifiedByAuthority" })],
    });
    const last = r.breakdown[r.breakdown.length - 1];
    expect(last).toBeDefined();
    expect(last!.runningTotal).toBe(r.confidenceScore);
  });

  it("breakdown runningTotal steps match cumulative delta sum", () => {
    const r = scoreProvenance({
      timeline: [
        event({ event: "A", tier: "verifiedByAuthority" }),
        event({ event: "P", tier: "reportedInPress" }),
      ],
    });
    let cumulative = 0;
    for (const entry of r.breakdown) {
      cumulative += entry.delta;
      expect(entry.runningTotal).toBe(cumulative);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Register coverage gap flag                                                  */
/* -------------------------------------------------------------------------- */

describe("scoreProvenance — registry flags", () => {
  it("emits registryCoverageGap flag when registers are not queryable", () => {
    const r = scoreProvenance({
      timeline: [],
      registry: {
        riskRelevantHits: [],
        notQueryable: 3,
        checks: [
          { verdict: "not-queryable", referralUrl: "https://interpol.int" },
          { verdict: "not-queryable" },
          { verdict: "not-queryable" },
        ],
      },
    });
    expect(r.flags.some((f) => f.type === "registryCoverageGap")).toBe(true);
  });
});

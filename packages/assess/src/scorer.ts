/**
 * Accumulation-model provenance scorer — the one canonical scorer for DPA v0.4.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/arts-provenance-agent
 *   (src/agent/assessRisk.ts). Designated canonical scorer per ADR-002.
 *
 * ADR-002 RATIONALE (canonical comment):
 *   Deduction models start from an implicit assertion that an object is
 *   trustworthy until evidence removes trust. That is backwards. An object with
 *   no published history is not a 100 waiting to be reduced — it is a low score
 *   that evidence has not yet raised. A base of 30 encodes "nothing is known",
 *   which is the honest starting position.
 *
 * TWO DEDUCTION SCORERS DELETED IN v0.4:
 *   1. arts-provenance-agent/src/web/pipeline.ts — started at 100 and deducted
 *      for gaps/flags. Produced near-perfect scores for untested objects; the
 *      absence of damaging evidence looked identical to documented clean history.
 *      Kept only as a reference implementation; not authoritative.
 *   2. provenance-search/server.js `computeConfidenceScore` — also deduction-
 *      based (started at 100, subtracted gaps × 30 and high flags × 20).
 *      Same epistemological defect as #1.
 *   Both are retired in v0.4. All scored results come from this file.
 *
 * See docs/DECISIONS.md#adr-002.
 */

import type { TimelineEvent, RiskFlag } from "@dpa/schema";

/* -------------------------------------------------------------------------- */
/* Input / output types                                                        */
/* -------------------------------------------------------------------------- */

export interface RegistryHit {
  claim: string;
  sourceUrl: string;
}

export interface RegistryCheck {
  verdict: string;
  referralUrl?: string;
}

export interface RegistrySummary {
  riskRelevantHits: RegistryHit[];
  notQueryable: number;
  checks: RegistryCheck[];
}

export interface ScorerInput {
  timeline: TimelineEvent[];
  registry?: RegistrySummary | null;
  premiumResult?: {
    match?: {
      confidenceDelta?: number;
      openClaim?: boolean;
      historicalClaim?: boolean;
      summary?: string;
    } | null;
  } | null;
  valuation?: { price: number; comparableMedian: number } | null;
  cryptoFlag?: RiskFlag | null;
}

/** One step in the score computation — every delta is explicit so the audit
 *  story is recomputable by hand. A paper shipped with a worked example whose
 *  arithmetic was wrong (upstream repo); this structure prevents that. */
export interface BreakdownEntry {
  reason: string;
  delta: number;
  runningTotal: number;
  source: string;
}

export interface ScorerResult {
  confidenceScore: number;
  flags: RiskFlag[];
  scorer: "accumulation-v0.4";
  /** Ordered steps. sum(breakdown[i].delta) === confidenceScore. */
  breakdown: BreakdownEntry[];
}

/* -------------------------------------------------------------------------- */
/* Scorer                                                                      */
/* -------------------------------------------------------------------------- */

export function scoreProvenance(input: ScorerInput): ScorerResult {
  const flags: RiskFlag[] = [];
  const { timeline } = input;

  let score = 0;
  const breakdown: BreakdownEntry[] = [];

  /** Apply a delta, record it, keep `score` in sync. */
  const adjust = (delta: number, reason: string, source: string): void => {
    score += delta;
    breakdown.push({ reason, delta, runningTotal: score, source });
  };

  // ── Base (30 = "nothing is known, honest starting position") ────────────
  adjust(30, "base score — 'nothing is known' starting position (ADR-002)", "ADR-002");

  // ── Positive accumulation: authoritative records ─────────────────────────
  for (const e of timeline) {
    if (e.tier === "verifiedByAuthority") {
      adjust(18, `authority record: "${e.event}"`, e.source);
    }
  }

  // ── Positive accumulation: press reports ─────────────────────────────────
  for (const e of timeline) {
    if (e.tier === "reportedInPress") {
      adjust(8, `press report: "${e.event}"`, e.source);
    }
  }

  // ── Cap at 100 after positive accumulation ───────────────────────────────
  if (score > 100) {
    adjust(100 - score, "cap at 100 (positive-evidence ceiling)", "ADR-002");
  }

  // ── Looting / repatriation signals ───────────────────────────────────────
  const repat = timeline.find((e) =>
    /repatriat|returned to|restitut|illicit|looted|stolen/i.test(
      `${e.event} ${e.location ?? ""}`,
    ),
  );
  if (repat) {
    flags.push({
      type: "repatriationPrecedent",
      severity: "high",
      evidence: `Timeline cites a repatriation/illicit-excavation event: "${repat.event}"`,
      source: repat.source,
    });
    flags.push({
      type: "lootingSignal",
      severity: "medium",
      evidence: "Object history intersects a documented looting/repatriation case.",
      source: repat.source,
    });
  }

  // ── Provenance gap (undated / incomplete early history) ──────────────────
  //
  // Asymmetric on purpose. A gap costs confidence; a complete chain earns none.
  // Under the accumulation model, positive chain documentation earns credit
  // through authority/press events above — the gap penalty is for the inverse
  // signal: traceable absence.
  const undated = timeline.filter((e) => !e.date).length;
  const earliest = timeline.find((e) => !!e.date);
  if (undated > 0 || (earliest?.date != null && earliest.date > "1900")) {
    const gapSource = earliest?.source ?? timeline[0]?.source ?? "n/a";
    adjust(-12, `provenance gap (${undated} undated event(s); no complete chain before earliest record)`, gapSource);
    flags.push({
      type: "provenanceGap",
      severity: "medium",
      evidence: `Pre-acquisition history is incomplete (${undated} undated event(s); no documented chain before earliest record).`,
      source: gapSource,
    });
  }

  // ── Stolen-art register hits ──────────────────────────────────────────────
  //
  // Asymmetric on purpose. A register hit costs confidence; a register that came
  // back empty earns none. "Nothing found" is not evidence — especially for
  // registers that can only contain objects somebody was able to report missing.
  if (input.registry) {
    for (const hit of input.registry.riskRelevantHits.slice(0, 3)) {
      adjust(-20, `register hit: "${hit.claim}"`, hit.sourceUrl);
      flags.push({
        type: "registrySignal",
        severity: "high",
        evidence: `Register source describes this object in theft/looting/restitution terms: "${hit.claim}". Verify against the register itself before relying on it.`,
        source: hit.sourceUrl,
      });
    }
    if (input.registry.notQueryable > 0) {
      const referral =
        input.registry.checks.find((c) => c.verdict === "not-queryable")?.referralUrl ?? "n/a";
      flags.push({
        type: "registryCoverageGap",
        severity: "low",
        evidence: `${input.registry.notQueryable} of ${input.registry.checks.length} registers have no public API and were not searched (INTERPOL SWOA, FBI NSAF, Carabinieri TPC among them). Their silence here means nothing — the official searches must be run by hand.`,
        source: referral,
      });
    }
  }

  // ── Premium ALR result ───────────────────────────────────────────────────
  if (input.premiumResult?.match) {
    const m = input.premiumResult.match;
    if (m.confidenceDelta != null && m.confidenceDelta !== 0) {
      // The ALR delta may push score above 100; enforce ceiling inline.
      const raw = m.confidenceDelta;
      const effective = score + raw > 100 ? 100 - score : raw;
      adjust(effective, "ALR premium search confidence delta", "Art Loss Register Premium Search");
    }
    if (m.openClaim) {
      flags.push({
        type: "alrPotentialMatch",
        severity: "high",
        evidence: `ALR premium search: OPEN claim — ${m.summary ?? ""}`,
        source: "Art Loss Register Premium Search",
      });
    } else if (m.historicalClaim) {
      flags.push({
        type: "alrPotentialMatch",
        severity: "low",
        evidence: `ALR premium search: historical (resolved) claim — ${m.summary ?? ""}`,
        source: "Art Loss Register Premium Search",
      });
    }
  }

  // ── Valuation anomaly (wash-trade / money-laundering signal) ────────────
  if (input.valuation && input.valuation.comparableMedian > 0) {
    const ratio = input.valuation.price / input.valuation.comparableMedian;
    if (ratio >= 3) {
      flags.push({
        type: "valuationAnomaly",
        severity: "high",
        evidence: `Sale price $${input.valuation.price.toLocaleString()} is ${ratio.toFixed(1)}× the comparable median $${input.valuation.comparableMedian.toLocaleString()} — possible wash-trade / laundering signal.`,
        source: "valuation comparables",
      });
    }
  }

  // ── AML on-chain payment flag ────────────────────────────────────────────
  if (input.cryptoFlag) flags.push(input.cryptoFlag);

  // ── Final clamp 0..100 (floor at 0 for heavily-penalised objects) ────────
  const raw = score;
  const confidenceScore = Math.max(0, Math.min(100, Math.round(score)));
  if (confidenceScore !== raw) {
    // Use adjust so the sum-of-deltas invariant is preserved
    adjust(
      confidenceScore - raw,
      confidenceScore < raw ? "floor at 0" : "round to integer",
      "ADR-002",
    );
  }

  // Invariant: sum(breakdown.map(e => e.delta)) === confidenceScore
  // Guaranteed by the adjust helper: every change to `score` is captured,
  // and the final value of `score` === confidenceScore.

  return { confidenceScore, flags, scorer: "accumulation-v0.4", breakdown };
}
